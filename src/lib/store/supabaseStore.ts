import { createClient } from '@supabase/supabase-js';
import type { Activity, Habit } from '@/lib/types';
import type { HabitStore } from './types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

function client() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

/** Supabase returns error objects, not Error instances - normalise so callers can rely on .message. */
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const supabaseStore: HabitStore = {
  name: 'supabase',

  async load() {
    const [habitsRes, activitiesRes] = await Promise.all([
      client().from('habits').select('*').is('archived_at', null).order('sort_order'),
      client().from('activities').select('*').order('occurred_on', { ascending: false }),
    ]);
    check(habitsRes.error);
    check(activitiesRes.error);
    return {
      habits: (habitsRes.data ?? []) as Habit[],
      activities: (activitiesRes.data ?? []) as Activity[],
    };
  },

  async createHabit(input) {
    const { count } = await client().from('habits').select('*', { count: 'exact', head: true });
    const { error } = await client().from('habits').insert({
      name: input.name,
      color: input.color,
      weekly_target: input.weeklyTarget,
      sort_order: count ?? 0,
    });
    check(error);
  },

  async updateHabit(habitId, patch) {
    const { error } = await client().from('habits').update(patch).eq('id', habitId);
    check(error);
  },

  async deleteHabit(habitId) {
    // activities cascade via the foreign key
    const { error } = await client().from('habits').delete().eq('id', habitId);
    check(error);
  },

  async setActiveLesson(habitId, lesson) {
    const { error } = await client()
      .from('habits')
      .update({ active_lesson_month: lesson.month, active_lesson_week: lesson.week })
      .eq('id', habitId);
    check(error);
  },

  async toggleDay(habitId, occurredOn, lesson) {
    const { data, error: selError } = await client()
      .from('activities')
      .select('id')
      .eq('habit_id', habitId)
      .eq('occurred_on', occurredOn)
      .maybeSingle();
    check(selError);

    if (data) {
      const { error } = await client().from('activities').delete().eq('id', data.id);
      check(error);
    } else {
      const { error } = await client()
        .from('activities')
        .insert({
          habit_id: habitId,
          occurred_on: occurredOn,
          source: 'manual',
          lesson_month: lesson?.month ?? null,
          lesson_week: lesson?.week ?? null,
        });
      check(error);
    }
  },

  async setLesson(habitId, occurredOn, month, week) {
    const { error } = await client()
      .from('activities')
      .upsert(
        {
          habit_id: habitId,
          occurred_on: occurredOn,
          source: 'manual',
          lesson_month: month,
          lesson_week: week,
        },
        { onConflict: 'habit_id,occurred_on' }
      );
    check(error);
  },

  async setDuration(habitId, occurredOn, seconds) {
    const { error } = await client()
      .from('activities')
      .update({ duration_seconds: seconds })
      .eq('habit_id', habitId)
      .eq('occurred_on', occurredOn);
    check(error);
  },
};
