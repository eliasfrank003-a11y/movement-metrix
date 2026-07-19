import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { store } from '@/lib/store';
import type { Activity, Habit } from '@/lib/types';

// This hook is called from more than one component, and each call owns its own
// state. Mutations broadcast so every mounted instance refetches - without this,
// completing a habit in one view leaves the others showing stale data.
const REFRESH_EVENT = 'movement:refresh';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const { habits: h, activities: a } = await store.load();
      setHabits(h);
      setActivities(a);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data.';
      console.error('[movement] load failed:', err);
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

  /** Run a mutation, then refresh every mounted instance. */
  const mutate = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action();
        await fetchAll();
        window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        console.error('[movement] mutation failed:', err);
        setError(message);
        throw err;
      }
    },
    [fetchAll]
  );

  const toggleDay = useCallback(
    (habitId: number, day: Date) =>
      mutate(() => store.toggleDay(habitId, format(day, 'yyyy-MM-dd'))),
    [mutate]
  );

  const setLesson = useCallback(
    (habitId: number, day: Date, month: number, week: number) =>
      mutate(() => store.setLesson(habitId, format(day, 'yyyy-MM-dd'), month, week)),
    [mutate]
  );

  const createHabit = useCallback(
    (input: { name: string; color: string; weeklyTarget: number }) =>
      mutate(() => store.createHabit(input)),
    [mutate]
  );

  const updateHabit = useCallback(
    (habitId: number, patch: Partial<Habit>) => mutate(() => store.updateHabit(habitId, patch)),
    [mutate]
  );

  const deleteHabit = useCallback(
    (habitId: number) => mutate(() => store.deleteHabit(habitId)),
    [mutate]
  );

  return {
    habits,
    activities,
    isLoading,
    error,
    storeName: store.name,
    refetch: fetchAll,
    toggleDay,
    setLesson,
    createHabit,
    updateHabit,
    deleteHabit,
  };
}
