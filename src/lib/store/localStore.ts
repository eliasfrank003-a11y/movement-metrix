import type { Activity, Habit } from '@/lib/types';
import type { HabitStore } from './types';

// Bump this when the seed shape changes so stale local data is replaced.
const STORAGE_KEY = 'movement-metrics:v2';

interface Snapshot {
  habits: Habit[];
  activities: Activity[];
  nextHabitId: number;
  nextActivityId: number;
}

/** One skill to start with. More become extra pages in the swipe deck. */
function seed(): Snapshot {
  const habits: Habit[] = [
    {
      id: 1,
      name: 'Movement',
      color: 'emerald',
      weekly_target: 5,
      calendar_id: null,
      sort_order: 0,
      archived_at: null,
    },
  ];

  // Starts empty - the year ahead is the point, not backfilled history.
  return { habits, activities: [], nextHabitId: 2, nextActivityId: 1 };
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
