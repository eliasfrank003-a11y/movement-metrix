interface ProgressBarProps {
  /** Training days completed. */
  done: number;
  /** Training days in the whole plan. */
  total: number;
  /** 0-1: how far through the 365 days today sits. */
  elapsedFraction: number;
}

/**
 * Completion as a filled bar, with a tick marking where in the year today falls.
 * Two facts on one axis: how much is done, and how much time it took.
 */
export function ProgressBar({ done, total, elapsedFraction }: ProgressBarProps) {
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Year progress</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {Math.round(pct)}%
        </span>
      </div>

      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${done} of ${total} training days complete`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
        {/* Where today sits in the year - shows whether you're keeping pace. */}
        <div
          className="absolute top-0 h-full w-px bg-foreground/50"
          style={{ left: `${Math.min(100, elapsedFraction * 100)}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
