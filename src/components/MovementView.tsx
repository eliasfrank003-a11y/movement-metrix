import { useMemo } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { Moon, Settings, Sun } from 'lucide-react';
import { buildPlan, PLAN_DAYS, type PlanDay } from '@/lib/plan';
import type { Activity } from '@/lib/types';
import { useTheme } from '@/hooks/useTheme';
import { DayCircle } from './DayCircle';
import { ProgressBar } from './ProgressBar';
import { Stats } from './Stats';
import { ProgramChart } from './ProgramChart';

interface MovementViewProps {
  /** Day the plan starts. Everything before it renders as inactive. */
  startDate: Date;
  activities: Activity[];
  doneDays: Set<string>;
  onToggle: (day: PlanDay) => void;
  onOpenSettings: () => void;
}

export function MovementView({
  startDate,
  activities,
  doneDays,
  onToggle,
  onOpenSettings,
}: MovementViewProps) {
  const months = useMemo(() => buildPlan(startDate), [startDate]);
  const { theme, toggle } = useTheme();

  const allDays = useMemo(() => months.flatMap((m) => m.days), [months]);
  const trainingDays = allDays.filter((d) => d.kind === 'train');
  const doneCount = allDays.filter((d) => d.kind !== 'before' && doneDays.has(d.key)).length;

  const totalSeconds = activities.reduce((sum, a) => sum + (a.duration_seconds ?? 0), 0);
  const daysElapsed = Math.max(0, differenceInCalendarDays(new Date(), startDate)) + 1;
  const elapsedFraction = Math.min(1, daysElapsed / PLAN_DAYS);

  return (
    <div className="px-5 pb-20 pt-8">
      <header className="mb-7 flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Movement</h1>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {doneCount} / {PLAN_DAYS}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mb-7">
        <ProgressBar
          done={doneCount}
          total={trainingDays.length}
          elapsedFraction={elapsedFraction}
        />
      </div>

      <div className="mb-8">
        <Stats totalSeconds={totalSeconds} daysElapsed={daysElapsed} />
      </div>

      <div className="mb-8">
        <ProgramChart activities={activities} startDate={startDate} />
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
