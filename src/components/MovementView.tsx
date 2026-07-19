import { useMemo } from 'react';
import { Moon, Sun } from 'lucide-react';
import { buildPlan, PLAN_DAYS, type PlanDay } from '@/lib/plan';
import { useTheme } from '@/hooks/useTheme';
import { DayCircle } from './DayCircle';

interface MovementViewProps {
  /** Day the plan starts. Everything before it renders as inactive. */
  startDate: Date;
  doneDays: Set<string>;
  onToggle: (day: PlanDay) => void;
}

export function MovementView({ startDate, doneDays, onToggle }: MovementViewProps) {
  const months = useMemo(() => buildPlan(startDate), [startDate]);
  const { theme, toggle } = useTheme();

  const doneCount = months
    .flatMap((m) => m.days)
    .filter((d) => d.kind !== 'before' && doneDays.has(d.key)).length;

  return (
    <div className="px-5 pb-20 pt-8">
      <header className="mb-10 flex items-start justify-between">
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
    </div>
  );
}
