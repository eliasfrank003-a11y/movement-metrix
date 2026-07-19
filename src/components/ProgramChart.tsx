import { useMemo } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { PLAN_DAYS } from '@/lib/plan';
import { TOTAL_LESSONS, lessonIndex, lessonLabel } from '@/lib/program';
import type { Activity } from '@/lib/types';

interface ProgramChartProps {
  activities: Activity[];
  startDate: Date;
}

const W = 320;
const H = 96;
const PAD_X = 4;
const PAD_T = 14;
const PAD_B = 6;

/**
 * Curriculum position over time. No gridlines and no axes - the shape is the
 * message, and at sixteen steps a scale would add clutter without adding
 * information. The current lesson is named at the end of the line instead.
 */
export function ProgramChart({ activities, startDate }: ProgramChartProps) {
  const points = useMemo(() => {
    return activities
      .filter((a) => a.lesson_month !== null && a.lesson_week !== null)
      .map((a) => ({
        day: differenceInCalendarDays(new Date(`${a.occurred_on}T00:00:00`), startDate),
        index: lessonIndex({ month: a.lesson_month!, week: a.lesson_week! }),
        label: lessonLabel({ month: a.lesson_month!, week: a.lesson_week! }),
        date: a.occurred_on,
      }))
      .sort((a, b) => a.day - b.day);
  }, [activities, startDate]);

  const x = (day: number) => PAD_X + (day / PLAN_DAYS) * (W - PAD_X * 2);
  const y = (index: number) => PAD_T + (1 - index / TOTAL_LESSONS) * (H - PAD_T - PAD_B);

  // Stepped: hold the level, then jump. A sloped line would imply being halfway
  // between two lessons, which never happens.
  const line = points.length
    ? points
        .map((p, i) =>
          i === 0
            ? `M ${x(p.day)} ${y(p.index)}`
            : `L ${x(p.day)} ${y(points[i - 1].index)} L ${x(p.day)} ${y(p.index)}`
        )
        .join(' ')
    : '';

  const last = points[points.length - 1];
  // Closing the path to the baseline gives the soft fill under the staircase.
  const area = points.length
    ? `${line} L ${x(last.day)} ${H - PAD_B} L ${x(points[0].day)} ${H - PAD_B} Z`
    : '';

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Programme
        </h2>
        {last && (
          <span className="text-[11px] tabular-nums text-muted-foreground">{last.label}</span>
        )}
      </div>

      {points.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Set a lesson in settings to start the curve.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Curriculum progress, currently ${last.label}`}
        >
          <defs>
            <linearGradient id="programFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={area} fill="url(#programFade)" />
          <path
            d={line}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Only the leading edge is marked; a dot per session would be noise. */}
          <circle
            cx={x(last.day)}
            cy={y(last.index)}
            r="3.5"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth="2"
          >
            <title>{`${format(new Date(`${last.date}T00:00:00`), 'd MMM')} · ${last.label}`}</title>
          </circle>
        </svg>
      )}
    </section>
  );
}
