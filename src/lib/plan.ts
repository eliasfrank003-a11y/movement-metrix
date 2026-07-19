import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfMonth,
} from 'date-fns';

/** Five days on, one off. Index 5 of every six is a rest day. */
export const CYCLE_LENGTH = 6;
export const PLAN_DAYS = 365;

export type DayKind = 'before' | 'train' | 'rest';

export interface PlanDay {
  date: Date;
  /** 'yyyy-MM-dd' - the key used everywhere for completion lookups. */
  key: string;
  kind: DayKind;
  isToday: boolean;
}

export interface PlanMonth {
  label: string;
  /** 'yyyy-MM', stable key for React. */
  id: string;
  days: PlanDay[];
}

/**
 * Builds the plan grid: every day from the 1st of the starting month through
 * PLAN_DAYS after `start`.
 *
 * Days before `start` are rendered as 'before' - they sit in the grid so the
 * first month isn't ragged, but they were never part of the plan.
 */
export function buildPlan(start: Date, today = new Date()): PlanMonth[] {
  const gridStart = startOfMonth(start);
  const lastDay = addDays(start, PLAN_DAYS - 1);
  const totalDays = differenceInCalendarDays(lastDay, gridStart) + 1;

  const months = new Map<string, PlanMonth>();

  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(gridStart, i);
    const offset = differenceInCalendarDays(date, start);

    const kind: DayKind =
      offset < 0 ? 'before' : offset % CYCLE_LENGTH === CYCLE_LENGTH - 1 ? 'rest' : 'train';

    const id = format(date, 'yyyy-MM');
    if (!months.has(id)) {
      months.set(id, { id, label: format(date, 'MMMM yyyy'), days: [] });
    }
    months.get(id)!.days.push({
      date,
      key: format(date, 'yyyy-MM-dd'),
      kind,
      isToday: differenceInCalendarDays(date, today) === 0,
    });
  }

  return [...months.values()];
}
