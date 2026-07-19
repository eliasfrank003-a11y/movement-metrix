import type { Activity, Habit } from '@/lib/types';

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
  toggleDay(habitId: number, occurredOn: string): Promise<void>;
  setDuration(habitId: number, occurredOn: string, seconds: number | null): Promise<void>;
}
