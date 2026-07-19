import { format, isSameDay, subDays } from 'date-fns';
import { Check, Flame } from 'lucide-react';
import { colorsFor, type Activity, type Habit } from '@/lib/types';
import { currentStreak, daySetFor, last7Count } from '@/lib/streaks';

interface HabitRowProps {
  habit: Habit;
  activities: Activity[];
  onToggle: (habitId: number, day: Date) => void;
  /** How many trailing days of history to show as squares. */
  historyDays?: number;
}

export function HabitRow({ habit, activities, onToggle, historyDays = 28 }: HabitRowProps) {
  const days = daySetFor(activities, habit.id);
  const today = new Date();
  const streak = currentStreak(days, today);
  const weekCount = last7Count(days, today);
  const colors = colorsFor(habit.color);

  // Oldest on the left, today on the right - reads like a timeline.
  const squares = Array.from({ length: historyDays }, (_, i) =>
    subDays(today, historyDays - 1 - i)
  );

  const doneToday = days.has(format(today, 'yyyy-MM-dd'));
  const onTrack = weekCount >= habit.weekly_target;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />
            <h3 className="truncate font-medium">{habit.name}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {weekCount}/{habit.weekly_target} this week
            {onTrack && ' · on track'}
            {streak > 0 && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {streak}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => onToggle(habit.id, today)}
          aria-label={doneToday ? `Mark ${habit.name} not done today` : `Mark ${habit.name} done today`}
          aria-pressed={doneToday}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
            doneToday
              ? `${colors.filled} border-transparent text-white`
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          <Check className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex gap-[3px] overflow-x-auto pb-1">
        {squares.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const done = days.has(key);
          return (
            <button
              key={key}
              onClick={() => onToggle(habit.id, day)}
              title={`${format(day, 'EEE d MMM')}${done ? ' · done' : ''}`}
              aria-label={`${format(day, 'd MMMM')}${done ? ', done' : ', not done'}`}
              className={`h-6 w-[10px] shrink-0 rounded-[2px] transition-colors ${
                done ? colors.filled : 'bg-muted hover:bg-border'
              } ${isSameDay(day, today) ? 'ring-1 ring-foreground/40' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}
