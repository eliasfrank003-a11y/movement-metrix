import { useMemo } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { PLAN_DAYS } from '@/lib/plan';
import { TOTAL_LESSONS, WEEKS_PER_MONTH, lessonIndex, lessonLabel } from '@/lib/program';
import type { Activity } from '@/lib/types';

interface ProgramChartProps {
  activities: Activity[];
  startDate: Date;
}

const W = 320;
const H = 150;
const PAD_L = 26;
const PAD_B = 18;
const PAD_T = 8;

/**
 * Curriculum position over time: one line, one axis, stepped because progress
 * happens in discrete lessons rather than continuously. A single series needs
 * no legend - the heading names it.
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

  const x = (day: number) => PAD_L + (day / PLAN_DAYS) * (W - PAD_L - 4);
  const y = (index: number) =>
    PAD_T + (1 - index / TOTAL_LESSONS) * (H - PAD_T - PAD_B);

  // Stepped path: hold the level, then jump. Sloped lines would imply you were
  // mid-way between two lessons, which never happens.
  const path = points.length
    ? points
        .map((p, i) =>
          i === 0
            ? `M ${x(p.day)} ${y(p.index)}`
            : `L ${x(p.day)} ${y(points[i - 1].index)} L ${x(p.day)} ${y(p.index)}`
        )
        .join(' ')
    : '';

  return (
    <section>
      <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Programme
      </h2>

      {points.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Tag a day with a lesson to start the curve.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Curriculum progress: currently ${points[points.length - 1].label}`}
        >
          {/* One gridline per month boundary - recessive, just for orientation. */}
          {Array.from({ length: TOTAL_LESSONS / WEEKS_PER_MONTH + 1 }, (_, i) => {
            const idx = i * WEEKS_PER_MONTH;
            return (
              <g key={idx}>
                <line
                  x1={PAD_L}
                  x2={W - 4}
                  y1={y(idx)}
                  y2={y(idx)}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
                {idx > 0 && (
                  <text
                    x={0}
                    y={y(idx) + 3}
                    className="fill-muted-foreground"
                    fontSize="8"
                  >
                    M{idx / WEEKS_PER_MONTH}
                  </text>
                )}
              </g>
            );
          })}

          <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />

          {points.map((p) => (
            <circle
              key={`${p.date}-${p.index}`}
              cx={x(p.day)}
              cy={y(p.index)}
              r="4"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth="2"
            >
              <title>{`${format(new Date(`${p.date}T00:00:00`), 'd MMM')} · ${p.label}`}</title>
            </circle>
          ))}

          {/* Only the latest point is labelled - a number on every point is noise.
              It flips side near the right edge so it never runs off the plot. */}
          {(() => {
            const last = points[points.length - 1];
            const px = x(last.day);
            const nearRight = px > W * 0.7;
            return (
              <text
                x={nearRight ? px - 7 : px + 7}
                y={Math.max(PAD_T + 7, y(last.index) - 7)}
                className="fill-foreground"
                fontSize="9"
                textAnchor={nearRight ? 'end' : 'start'}
              >
                {last.label}
              </text>
            );
          })()}
        </svg>
      )}
    </section>
  );
}
