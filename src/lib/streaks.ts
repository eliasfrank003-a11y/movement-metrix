import { differenceInCalendarDays, format, subDays } from 'date-fns';
import type { Activity } from './types';

/** Set of 'yyyy-MM-dd' strings a habit was completed on, for O(1) lookups. */
export function daySetFor(activities: Activity[], habitId: number): Set<string> {
  return new Set(
    activities.filter((a) => a.habit_id === habitId).map((a) => a.occurred_on)
  );
}

/**
 * Consecutive days ending today. Today not being done yet doesn't break a
 * streak - it's only broken once yesterday is missed too, so the number doesn't
 * drop to zero every morning.
 */
export function currentStreak(days: Set<string>, today = new Date()): number {
  let streak = 0;
  let cursor = days.has(format(today, 'yyyy-MM-dd')) ? today : subDays(today, 1);

  while (days.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/** How many of the last 7 days (inclusive of today) the habit was done. */
export function last7Count(days: Set<string>, today = new Date()): number {
  let count = 0;
  for (let i = 0; i < 7; i += 1) {
    if (days.has(format(subDays(today, i), 'yyyy-MM-dd'))) count += 1;
  }
  return count;
}

/** Calendar days from the earliest activity to today, for sizing the heatmap. */
export function daysTracked(activities: Activity[], today = new Date()): number {
  if (activities.length === 0) return 0;
  const earliest = activities.reduce(
    (min, a) => (a.occurred_on < min ? a.occurred_on : min),
    activities[0].occurred_on
  );
  return differenceInCalendarDays(today, new Date(`${earliest}T00:00:00`)) + 1;
}
