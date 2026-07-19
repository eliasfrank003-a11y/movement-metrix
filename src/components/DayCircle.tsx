import { isMissed, type PlanDay } from '@/lib/plan';

interface DayCircleProps {
  day: PlanDay;
  done: boolean;
  onToggle: (day: PlanDay) => void;
}

/**
 * Every state occupies the same 12px circle inside the same 18px slot, so the
 * year reads as an even field rather than a grid with holes in it. States are
 * distinguished by weight, not by size.
 */
export function DayCircle({ day, done, onToggle }: DayCircleProps) {
  // Days before the plan started are inert - shown for alignment, not tappable.
  if (day.kind === 'before') {
    return (
      <div className="flex h-[18px] w-[18px] items-center justify-center" aria-hidden="true">
        <span className="h-px w-2 rounded-full bg-day-rest" />
      </div>
    );
  }

  const isRest = day.kind === 'rest';
  const missed = isMissed(day, done);

  return (
    <button
      onClick={() => onToggle(day)}
      aria-pressed={done}
      aria-label={`${day.date.toDateString()}${isRest ? ', rest day' : ''}${
        done ? ', done' : missed ? ', missed' : ''
      }`}
      className="flex h-[18px] w-[18px] items-center justify-center"
    >
      <span
        className={`rounded-full transition-colors ${
          done
            ? 'h-3 w-3 bg-primary'
            : isRest
              ? // A smaller solid dot every sixth day: the rest cadence reads as
                // rhythm rather than as a gap, and needs no second colour.
                'h-1.5 w-1.5 bg-day-empty'
              : missed
                ? 'h-3 w-3 border border-day-missed bg-day-missed/25'
                : 'h-3 w-3 border border-day-empty hover:border-foreground/60'
        } ${day.isToday && !done ? 'ring-1 ring-day-today ring-offset-2 ring-offset-background' : ''}`}
      />
    </button>
  );
}
