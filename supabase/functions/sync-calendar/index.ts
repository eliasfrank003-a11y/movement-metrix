import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEvent {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

/** How far back to reconcile on each run. */
const DEFAULT_WINDOW_DAYS = 90;

/**
 * Signs a JWT with the service account key and trades it for an access token.
 * Lifted from musical-metrics, which has been running this in production.
 */
async function getServiceAccountAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const base64UrlEncode = (obj: object): string =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const unsignedToken = [
    base64UrlEncode({ alg: "RS256", typ: "JWT" }),
    base64UrlEncode({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ].join(".");

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedToken}.${signatureBase64}`,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("[sync-calendar] Token exchange failed:", errorText);
    throw new Error(`Failed to get access token: ${tokenResponse.status}`);
  }

  return (await tokenResponse.json()).access_token;
}

/** Local calendar day of an event, as 'yyyy-MM-dd'. */
function localDayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA"); // en-CA formats as YYYY-MM-DD
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID");

    if (!serviceAccountJson || !calendarId) {
      const missing = !serviceAccountJson
        ? "GOOGLE_SERVICE_ACCOUNT_JSON"
        : "GOOGLE_CALENDAR_ID";
      console.error(`[sync-calendar] Missing ${missing}`);
      return new Response(
        JSON.stringify({ error: `Server configuration error: missing ${missing}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accessToken = await getServiceAccountAccessToken(serviceAccountJson);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Single-habit app: everything syncs onto the first habit.
    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select("id, active_lesson_month, active_lesson_week")
      .is("archived_at", null)
      .order("sort_order")
      .limit(1)
      .maybeSingle();

    if (habitError) throw new Error(`Failed to load habit: ${habitError.message}`);
    if (!habit) throw new Error("No habit configured to sync into.");

    // Reconcile a rolling window rather than tracking a cursor. Re-running is
    // then always safe: the same events produce the same totals.
    const windowDays = Number(new URL(req.url).searchParams.get("days")) || DEFAULT_WINDOW_DAYS;
    const timeMin = new Date(Date.now() - windowDays * 86400_000).toISOString();

    const calendarApiUrl = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    calendarApiUrl.searchParams.set("timeMin", timeMin);
    calendarApiUrl.searchParams.set("timeMax", new Date().toISOString());
    calendarApiUrl.searchParams.set("singleEvents", "true");
    calendarApiUrl.searchParams.set("orderBy", "startTime");
    calendarApiUrl.searchParams.set("maxResults", "2500");

    const eventsResponse = await fetch(calendarApiUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error("[sync-calendar] Calendar API error:", errorText);
      throw new Error(`Failed to fetch calendar events: ${eventsResponse.status}`);
    }

    const events: CalendarEvent[] = (await eventsResponse.json()).items ?? [];

    // One activity row per day, so same-day events are summed rather than
    // fighting over the (habit_id, occurred_on) unique index.
    const byDay = new Map<string, { seconds: number; firstStart: string }>();

    for (const event of events) {
      if (!event.start?.dateTime || !event.end?.dateTime) continue; // skip all-day
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      const seconds = Math.round((end.getTime() - start.getTime()) / 1000);
      if (seconds <= 0) continue;

      const key = localDayKey(event.start.dateTime);
      const existing = byDay.get(key);
      if (existing) {
        existing.seconds += seconds;
      } else {
        byDay.set(key, { seconds, firstStart: event.start.dateTime });
      }
    }

    let created = 0;
    let updated = 0;

    for (const [day, { seconds, firstStart }] of byDay) {
      const { data: existing, error: selError } = await supabase
        .from("activities")
        .select("id")
        .eq("habit_id", habit.id)
        .eq("occurred_on", day)
        .maybeSingle();

      if (selError) throw new Error(`Lookup failed for ${day}: ${selError.message}`);

      if (existing) {
        // Only the duration is refreshed - a lesson tag set by hand survives.
        const { error } = await supabase
          .from("activities")
          .update({ duration_seconds: seconds, started_at: firstStart, source: "google_calendar" })
          .eq("id", existing.id);
        if (error) throw new Error(`Update failed for ${day}: ${error.message}`);
        updated += 1;
      } else {
        const { error } = await supabase.from("activities").insert({
          habit_id: habit.id,
          occurred_on: day,
          duration_seconds: seconds,
          started_at: firstStart,
          source: "google_calendar",
          lesson_month: habit.active_lesson_month,
          lesson_week: habit.active_lesson_week,
        });
        if (error) throw new Error(`Insert failed for ${day}: ${error.message}`);
        created += 1;
      }
    }

    console.log(`[sync-calendar] ${events.length} events -> ${created} new, ${updated} updated`);

    return new Response(
      JSON.stringify({ events: events.length, days: byDay.size, created, updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[sync-calendar] Failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
