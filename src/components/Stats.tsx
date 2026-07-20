interface StatsProps {
  totalSeconds: number;
  /** Days elapsed since the plan started, for the daily average. */
  daysElapsed: number;
  /** Training days that have come due, rest days excluded. */
  dueTrainingDays: number;
  /** How many of those were actually done. */
  doneTrainingDays: number;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function Tile({ label, value, srLabel }: { label: string; value: string; srLabel: string }) {
  return (
    <div className="flex items-baseline justify-center gap-1.5 rounded-xl bg-card px-3 py-3">
      <span className="sr-only">{srLabel}: </span>
      {label && (
        <span className="text-[13px] text-muted-foreground" aria-hidden="true">
          {label}
        </span>
      )}
      <span className="text-[15px] font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function Stats({
  totalSeconds,
  daysElapsed,
  dueTrainingDays,
  doneTrainingDays,
}: StatsProps) {
  // Averaged over every elapsed day, not just active ones - a rest day counts
  // as a zero, which is the honest reading of "per day".
  const avgSeconds = daysElapsed > 0 ? totalSeconds / daysElapsed : 0;

  // Rest days are excluded from both sides: you can't miss a day off.
  const rate = dueTrainingDays > 0 ? Math.round((doneTrainingDays / dueTrainingDays) * 100) : null;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Tile label="Σ" srLabel="Total moved" value={formatDuration(totalSeconds)} />
      <Tile label="∅" srLabel="Daily average" value={formatDuration(avgSeconds)} />
      {/* The percent sign carries the meaning, so no label is needed. */}
      <Tile label="" srLabel="Completion rate" value={rate === null ? '—' : `${rate}%`} />
    </div>
  );
}
