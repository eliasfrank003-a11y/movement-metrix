import { useMemo, useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { MovementView } from '@/components/MovementView';
import { SwipeDeck } from '@/components/SwipeDeck';
import { SettingsPanel } from '@/components/SettingsPanel';
import type { PlanDay } from '@/lib/plan';
import type { Lesson } from '@/lib/program';

/** The day the plan begins. Days before this render as inactive placeholders. */
const PLAN_START = new Date(2026, 6, 19); // 19 July 2026

export default function App() {
  const { habits, activities, isLoading, error, toggleDay, setActiveLesson, refetch } =
    useHabits();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { state: syncState, sync, enabled: syncEnabled } = useCalendarSync(refetch);

  const movement = habits[0];

  const doneDays = useMemo(
    () =>
      new Set(
        activities.filter((a) => a.habit_id === movement?.id).map((a) => a.occurred_on)
      ),
    [activities, movement?.id]
  );

  // Days inherit whatever lesson is active in settings at the time they're clocked.
  const activeLesson = useMemo<Lesson | null>(
    () =>
      movement?.active_lesson_month && movement?.active_lesson_week
        ? { month: movement.active_lesson_month, week: movement.active_lesson_week }
        : null,
    [movement?.active_lesson_month, movement?.active_lesson_week]
  );

  const handleToggle = (day: PlanDay) => {
    if (!movement) return;
    toggleDay(movement.id, day.date, activeLesson);
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-md">
      <SwipeDeck
        pages={[
          {
            id: 'movement',
            content: (
              <MovementView
                startDate={PLAN_START}
                activities={activities.filter((a) => a.habit_id === movement?.id)}
                doneDays={doneDays}
                onToggle={handleToggle}
                onOpenSettings={() => setSettingsOpen(true)}
                onSync={sync}
                syncing={syncState === 'running'}
                syncEnabled={syncEnabled}
              />
            ),
          },
        ]}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        activeLesson={activeLesson}
        onSelectLesson={(lesson) => movement && setActiveLesson(movement.id, lesson)}
      />
    </div>
  );
}
