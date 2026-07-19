import { format, subDays } from 'date-fns';
import type { Activity, Habit } from '@/lib/types';
import type { HabitStore } from './types';

const STORAGE_KEY = 'movement-metrics:v1';

interface Snapshot {
  habits: Habit[];
  activities: Activity[];
  nextHabitId: number;
  nextActivityId: number;
}

/** A few habits with plausible history, so the UI has something to show on day one. */
function seed(): Snapshot {
  const today = new Date();
  const habits: Habit[] = [
    { id: 1, name: 'Running', color: 'emerald', weekly_target: 3, calendar_id: null, sort_order: 0, archived_at: null },
    { id: 2, name: 'Gym', color: 'sky', weekly_target: 2, calendar_id: null, sort_order: 1, archived_at: null },
    { id: 3, name: 'Stretching', color: 'amber', weekly_target: 5, calendar_id: null, sort_order: 2, archived_at: null },
  ];

  // Deterministic-ish spread so the heatmap looks like real use rather than noise.
  const pattern: Record<number, number[]> = {
    1: [0, 2, 5, 7, 9, 12, 14, 16, 19, 21, 23, 26],
    2: [1, 4, 8, 11, 15, 18, 22, 25],
    3: [0, 1, 2, 3, 5, 6, 7, 9, 10, 12, 13, 14, 16, 17, 19, 20, 21, 23, 24, 26, 27],
  };

  let id = 1;
  const activities: Activity[] = [];
  for (const habit of habits) {
    for (const offset of pattern[habit.id]) {
      activities.push({
        id: id++,
        habit_id: habit.id,
        occurred_on: format(subDays(today, offset), 'yyyy-MM-dd'),
        duration_seconds: null,
        source: 'manual',
        note: null,
      });
    }
  }

  return { habits, activities, nextHabitId: 4, nextActivityId: id };
}

function read(): Snapshot {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    return JSON.parse(raw) as Snapshot;
  } catch {
    // Corrupt payload shouldn't brick the app - start over rather than crash.
    console.warn('[movement] local data unreadable, reseeding');
    const fresh = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

function write(snapshot: Snapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export const localStore: HabitStore = {
  name: 'local',

  async load() {
    const { habits, activities } = read();
    return {
      habits: habits.filter((h) => h.archived_at === null).sort((a, b) => a.sort_order - b.sort_order),
      activities,
    };
  },

  async createHabit(input) {
    const snap = read();
    snap.habits.push({
      id: snap.nextHabitId,
      name: input.name,
      color: input.color,
      weekly_target: input.weeklyTarget,
      calendar_id: null,
      sort_order: snap.habits.length,
      archived_at: null,
    });
    snap.nextHabitId += 1;
    write(snap);
  },

  async updateHabit(habitId, patch) {
    const snap = read();
    snap.habits = snap.habits.map((h) => (h.id === habitId ? { ...h, ...patch } : h));
    write(snap);
  },

  async deleteHabit(habitId) {
    const snap = read();
    snap.habits = snap.habits.filter((h) => h.id !== habitId);
    snap.activities = snap.activities.filter((a) => a.habit_id !== habitId);
    write(snap);
  },

  async toggleDay(habitId, occurredOn) {
    const snap = read();
    const existing = snap.activities.find(
      (a) => a.habit_id === habitId && a.occurred_on === occurredOn
    );
    if (existing) {
      snap.activities = snap.activities.filter((a) => a.id !== existing.id);
    } else {
      snap.activities.push({
        id: snap.nextActivityId,
        habit_id: habitId,
        occurred_on: occurredOn,
        duration_seconds: null,
        source: 'manual',
        note: null,
      });
      snap.nextActivityId += 1;
    }
    write(snap);
  },

  async setDuration(habitId, occurredOn, seconds) {
    const snap = read();
    snap.activities = snap.activities.map((a) =>
      a.habit_id === habitId && a.occurred_on === occurredOn
        ? { ...a, duration_seconds: seconds }
        : a
    );
    write(snap);
  },
};
