import { format } from 'date-fns';
import { useHabits } from '@/hooks/useHabits';
import { HabitRow } from '@/components/HabitRow';
import { AddHabitForm } from '@/components/AddHabitForm';

export default function App() {
  const { habits, activities, isLoading, error, storeName, toggleDay, createHabit } = useHabits();

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Movement Metrics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, d MMMM')}
          {storeName === 'local' && (
            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
              local data
            </span>
          )}
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3">
          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              activities={activities}
              onToggle={toggleDay}
            />
          ))}

          {habits.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No habits yet. Add your first one below.
            </p>
          )}

          <AddHabitForm onCreate={createHabit} />
        </div>
      )}
    </div>
  );
}
