import { useMemo } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { Moon, Sun } from 'lucide-react';
import { buildPlan, PLAN_DAYS, type PlanDay } from '@/lib/plan';
import type { Lesson } from '@/lib/program';
import type { Activity } from '@/lib/types';
import { useTheme } from '@/hooks/useTheme';
import { DayCircle } from './DayCircle';
import { ProgressBar } from './ProgressBar';
import { Stats } from './Stats';
import { ProgramChart } from './ProgramChart';
import { LessonPicker } from './LessonPicker';

interface MovementViewProps {
  /** Day the plan starts. Everything before it renders as inactive. */
  startDate: Date;
  activities: Activity[];
  doneDays: Set<string>;
  onToggle: (day: PlanDay) => void;
  onPickLesson: (lesson: Lesson) => void;
}

export function MovementView({
  startDate,
  activities,
  doneDays,
  onToggle,
  onPickLesson,
}: MovementViewProps) {
  const months = useMemo(() => buildPlan(startDate), [startDate]);
  const { theme, toggle } = useTheme();

  const allDays = useMemo(() => months.flatMap((m) => m.days), [months]);
  const trainingDays = allDays.filter((d) => d.kind === 'train');
  const doneCount = allDays.filter((d) => d.kind !== 'before' && doneDays.has(d.key)).length;

  const totalSeconds = activities.reduce((sum, a) => sum + (a.duration_seconds ?? 0), 0);
  const daysElapsed = Math.max(0, differenceInCalendarDays(new Date(), startDate)) + 1;
  const elapsedFraction = Math.min(1, daysElapsed / PLAN_DAYS);

  // Consecutive completed training days working backwards from today.
  const currentStreak = useMemo(() => {
    let streak = 0;
    const past = trainingDays.filter((d) => d.isPast || d.isToday).reverse();
    for (const day of past) {
      if (doneDays.has(day.key)) streak += 1;
      else if (!day.isToday) break;
    }
    return streak;
  }, [trainingDays, doneDays]);

  // The lesson tagged most recently, used to highlight the picker.
  const currentLesson = useMemo<Lesson | null>(() => {
    const tagged = activities
      .filter((a) => a.lesson_month !== null && a.lesson_week !== null)
      .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
    const last = tagged[tagged.length - 1];
    return last ? { month: last.lesson_month!, week: last.lesson_week! } : null;
  }, [activities]);

  return (
    <div className="px-5 pb-20 pt-8">
      <header className="mb-7 flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Movement</h1>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {doneCount} / {PLAN_DAYS}
          </p>
        </div>
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      <div className="mb-7">
        <ProgressBar
          done={doneCount}
          total={trainingDays.length}
          elapsedFraction={elapsedFraction}
        />
      </div>

      <div className="mb-8">
        <Stats
          totalSeconds={totalSeconds}
          daysElapsed={daysElapsed}
          currentStreak={currentStreak}
        />
      </div>

      <div className="mb-8">
        <ProgramChart activities={activities} startDate={startDate} />
      </div>

      <div className="mb-9">
        <LessonPicker current={currentLesson} onPick={onPickLesson} />
      </div>

      <div className="space-y-8">
        {months.map((month) => (
          <section key={month.id}>
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {month.label}
            </h2>
            <div className="flex flex-wrap gap-[3px]">
              {month.days.map((day) => (
                <DayCircle
                  key={day.key}
                  day={day}
                  done={doneDays.has(day.key)}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-[11px] text-muted-foreground">
        started {format(startDate, 'd MMM yyyy')}
      </p>
    </div>
  );
}
