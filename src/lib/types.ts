export interface Habit {
  id: number;
  name: string;
  color: string;
  weekly_target: number;
  calendar_id: string | null;
  /** The lesson every newly clocked day is tagged with, until you change it. */
  active_lesson_month: number | null;
  active_lesson_week: number | null;
  sort_order: number;
  archived_at: string | null;
}

export interface Activity {
  id: number;
  habit_id: number;
  /** Local calendar day, 'yyyy-MM-dd'. Completion is per-day, not per-instant. */
  occurred_on: string;
  duration_seconds: number | null;
  source: 'manual' | 'google_calendar';
  note: string | null;
  /** Curriculum position for this session. Null until you tag it. */
  lesson_month: number | null;
  lesson_week: number | null;
}

/** Tailwind classes per habit color, kept in one place so the palette stays consistent. */
export const HABIT_COLORS: Record<string, { dot: string; filled: string }> = {
  emerald: { dot: 'bg-emerald-500', filled: 'bg-emerald-500' },
  sky: { dot: 'bg-sky-500', filled: 'bg-sky-500' },
  amber: { dot: 'bg-amber-500', filled: 'bg-amber-500' },
  violet: { dot: 'bg-violet-500', filled: 'bg-violet-500' },
  rose: { dot: 'bg-rose-500', filled: 'bg-rose-500' },
};

export const DEFAULT_COLOR = 'emerald';

export function colorsFor(color: string) {
  return HABIT_COLORS[color] ?? HABIT_COLORS[DEFAULT_COLOR];
}
