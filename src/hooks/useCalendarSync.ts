import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/store/supabaseStore';

const AUTO_SYNC_MS = 30_000;

export type SyncState = 'idle' | 'running' | 'error';

export interface SyncResult {
  created: number;
  updated: number;
  removed: number;
}

/**
 * Pulls the calendar on an interval and on tab focus.
 *
 * The timer is paused while the tab is hidden - a phone left on the home screen
 * shouldn't keep firing requests - and a fresh sync runs the moment it returns,
 * so coming back to the app always shows current data.
 */
export function useCalendarSync(onChanged: () => void) {
  const [state, setState] = useState<SyncState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  // Guards against a slow sync overlapping the next tick.
  const inFlight = useRef(false);

  const sync = useCallback(async () => {
    if (!supabase || inFlight.current) return;
    inFlight.current = true;
    setState('running');
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-calendar');
      if (fnError) throw new Error(fnError.message);
      const result: SyncResult = {
        created: data?.created ?? 0,
        updated: data?.updated ?? 0,
        removed: data?.removed ?? 0,
      };
      setLastResult(result);
      setState('idle');
      // Only refetch when something actually moved, to avoid a render every 30s.
      if (result.created || result.updated || result.removed) onChanged();
    } catch (err) {
      console.error('[movement] sync failed:', err);
      setError(err instanceof Error ? err.message : 'Sync failed.');
      setState('error');
    } finally {
      inFlight.current = false;
    }
  }, [onChanged]);

  useEffect(() => {
    if (!supabase) return;

    sync();
    let timer = window.setInterval(sync, AUTO_SYNC_MS);

    const handleVisibility = () => {
      window.clearInterval(timer);
      if (document.visibilityState === 'visible') {
        sync();
        timer = window.setInterval(sync, AUTO_SYNC_MS);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [sync]);

  return { state, error, lastResult, sync, enabled: Boolean(supabase) };
}
