import type { Activity, Habit } from '@/lib/types';
import type { Lesson } from '@/lib/program';

/**
 * The app talks to this, never to a database directly.
 *
 * While the shape of the app is still moving, the local implementation keeps
 * everything in the browser so schema changes cost nothing. Once the design
 * settles, the Supabase implementation takes over with no UI changes.
 */
export interface HabitStore {
  readonly name: 'local' | 'supabase';
  load(): Promise<{ habits: Habit[]; activities: Activity[] }>;
  createHabit(input: { name: string; color: string; weeklyTarget: number }): Promise<void>;
  updateHabit(habitId: number, patch: Partial<Habit>): Promise<void>;
  deleteHabit(habitId: number): Promise<void>;
  /** Mark done if not done, clear if already done. Idempotent per (habit, day). */
  /** `lesson` stamps the active curriculum position onto newly created days. */
  toggleDay(habitId: number, occurredOn: string, lesson?: Lesson | null): Promise<void>;
  setActiveLesson(habitId: number, lesson: Lesson): Promise<void>;
  setDuration(habitId: number, occurredOn: string, seconds: number | null): Promise<void>;
  /** Tag a day with its curriculum position. Creates the day if not yet done. */
  setLesson(habitId: number, occurredOn: string, month: number, week: number): Promise<void>;
}
