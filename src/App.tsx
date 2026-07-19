import { useMemo } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { MovementView } from '@/components/MovementView';
import { SwipeDeck } from '@/components/SwipeDeck';
import type { PlanDay } from '@/lib/plan';

/** The day the plan begins. Days before this render as inactive placeholders. */
const PLAN_START = new Date(2026, 6, 19); // 19 July 2026

export default function App() {
  const { habits, activities, isLoading, error, toggleDay } = useHabits();

  const movement = habits[0];

  const doneDays = useMemo(
    () =>
      new Set(
        activities.filter((a) => a.habit_id === movement?.id).map((a) => a.occurred_on)
      ),
    [activities, movement?.id]
  );

  const handleToggle = (day: PlanDay) => {
    if (!movement) return;
    toggleDay(movement.id, day.date);
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
                doneDays={doneDays}
                onToggle={handleToggle}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
