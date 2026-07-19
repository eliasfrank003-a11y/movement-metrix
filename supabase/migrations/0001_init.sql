-- Movement Metrics: core schema
--
-- Design rule: one column per concept. A habit's identity, its schedule, and its
-- calendar binding are separate fields - never packed into a shared text column.

CREATE TABLE public.habits (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT 'emerald',
  -- How many days per week this habit is aimed at. Drives the "on track" ring.
  weekly_target INTEGER NOT NULL DEFAULT 3 CHECK (weekly_target BETWEEN 1 AND 7),
  -- Google Calendar this habit syncs from. NULL = manual entry only.
  calendar_id   TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  archived_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.activities (
  id               SERIAL PRIMARY KEY,
  habit_id         INTEGER NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  -- The day this counts toward, in local time. Completion is per-day, so this is
  -- a DATE, not a timestamp - the "did it happen today" question never needs more.
  occurred_on      DATE NOT NULL,
  -- Optional: interesting but never required for a day to count as done.
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  -- Set only for calendar-sourced rows; used to dedupe re-syncs.
  started_at       TIMESTAMPTZ,
  external_id      TEXT,
  source           TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'google_calendar')),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per habit per day: tapping a day twice toggles, it never duplicates.
CREATE UNIQUE INDEX activities_habit_day_unique
  ON public.activities (habit_id, occurred_on);

-- Calendar events are deduped by their Google event id, so re-syncing is a no-op.
CREATE UNIQUE INDEX activities_external_id_unique
  ON public.activities (external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX activities_occurred_on_idx ON public.activities (occurred_on DESC);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Single-user app with no auth: public policies, matching musical-metrics.
-- If this ever gains a second user, these must be replaced with auth.uid() checks.
CREATE POLICY "public read habits"   ON public.habits     FOR SELECT USING (true);
CREATE POLICY "public insert habits" ON public.habits     FOR INSERT WITH CHECK (true);
CREATE POLICY "public update habits" ON public.habits     FOR UPDATE USING (true);
CREATE POLICY "public delete habits" ON public.habits     FOR DELETE USING (true);

CREATE POLICY "public read acts"     ON public.activities FOR SELECT USING (true);
CREATE POLICY "public insert acts"   ON public.activities FOR INSERT WITH CHECK (true);
CREATE POLICY "public update acts"   ON public.activities FOR UPDATE USING (true);
CREATE POLICY "public delete acts"   ON public.activities FOR DELETE USING (true);
