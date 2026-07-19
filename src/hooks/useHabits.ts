import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { Activity, Habit } from '@/lib/types';

// This hook is called from more than one component, and each call owns its own
// state. Mutations broadcast so every mounted instance refetches - without this,
// completing a habit in one view leaves the others showing stale data.
const REFRESH_EVENT = 'movement:refresh';

function broadcastRefresh() {
  window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [habitsRes, activitiesRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .is('archived_at', null)
          .order('sort_order', { ascending: true }),
        supabase.from('activities').select('*').order('occurred_on', { ascending: false }),
      ]);

      if (habitsRes.error) throw new Error(habitsRes.error.message);
      if (activitiesRes.error) throw new Error(activitiesRes.error.message);

      setHabits(habitsRes.data ?? []);
      setActivities(activitiesRes.data ?? []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data.';
      console.error('[movement] fetch failed:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const handler = () => { fetchAll(); };
    window.addEventListener(REFRESH_EVENT, handler);
    return () => window.removeEventListener(REFRESH_EVENT, handler);
  }, [fetchAll]);

  /**
   * Mark a habit done or undone for a given day. The unique index on
   * (habit_id, occurred_on) means this can never create a duplicate.
   */
  const toggleDay = useCallback(
    async (habitId: number, day: Date) => {
      const occurredOn = format(day, 'yyyy-MM-dd');
      const existing = activities.find(
        (a) => a.habit_id === habitId && a.occurred_on === occurredOn
      );

      try {
        if (existing) {
          const { error: delError } = await supabase
            .from('activities')
            .delete()
            .eq('id', existing.id);
          if (delError) throw new Error(delError.message);
        } else {
          const { error: insError } = await supabase
            .from('activities')
            .insert({ habit_id: habitId, occurred_on: occurredOn, source: 'manual' });
          if (insError) throw new Error(insError.message);
        }
        await fetchAll();
        broadcastRefresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update.';
        console.error('[movement] toggle failed:', err);
        setError(message);
      }
    },
    [activities, fetchAll]
  );

  const createHabit = useCallback(
    async (input: { name: string; color: string; weeklyTarget: number }) => {
      const { error: insError } = await supabase.from('habits').insert({
        name: input.name,
        color: input.color,
        weekly_target: input.weeklyTarget,
        sort_order: habits.length,
      });
      if (insError) throw new Error(insError.message);
      await fetchAll();
      broadcastRefresh();
    },
    [habits.length, fetchAll]
  );

  const deleteHabit = useCallback(
    async (habitId: number) => {
      const { error: delError } = await supabase.from('habits').delete().eq('id', habitId);
      if (delError) throw new Error(delError.message);
      await fetchAll();
      broadcastRefresh();
    },
    [fetchAll]
  );

  return {
    habits,
    activities,
    isLoading,
    error,
    refetch: fetchAll,
    toggleDay,
    createHabit,
    deleteHabit,
  };
}
