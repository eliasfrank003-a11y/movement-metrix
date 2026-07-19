/**
 * The curriculum layer, kept deliberately separate from the daily layer.
 *
 * "Did you move today" and "which lesson are you on" are different questions.
 * An activity records both, but neither depends on the other - you can move
 * without advancing, and repeat a week as many times as you like.
 */

export const MONTHS = 4;
export const WEEKS_PER_MONTH = 4;
export const TOTAL_LESSONS = MONTHS * WEEKS_PER_MONTH; // 16

export interface Lesson {
  month: number; // 1-4
  week: number; // 1-4
}

/** 1-based position in the whole programme, so progress plots on one axis. */
export function lessonIndex({ month, week }: Lesson): number {
  return (month - 1) * WEEKS_PER_MONTH + week;
}

export function lessonFromIndex(index: number): Lesson {
  const clamped = Math.min(TOTAL_LESSONS, Math.max(1, index));
  return {
    month: Math.floor((clamped - 1) / WEEKS_PER_MONTH) + 1,
    week: ((clamped - 1) % WEEKS_PER_MONTH) + 1,
  };
}

export function lessonLabel({ month, week }: Lesson): string {
  return `M${month} · W${week}`;
}

export const ALL_LESSONS: Lesson[] = Array.from({ length: TOTAL_LESSONS }, (_, i) =>
  lessonFromIndex(i + 1)
);
