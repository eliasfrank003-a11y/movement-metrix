interface StatsProps {
  totalSeconds: number;
  /** Days elapsed since the plan started, for the daily average. */
  daysElapsed: number;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-medium tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

export function Stats({ totalSeconds, daysElapsed }: StatsProps) {
  // Averaged over every elapsed day, not just active ones - a rest day counts
  // as a zero, which is the honest reading of "per day".
  const avgSeconds = daysElapsed > 0 ? totalSeconds / daysElapsed : 0;

  return (
    <div className="flex justify-center gap-12">
      <Stat label="total moved" value={formatDuration(totalSeconds)} />
      <Stat label="daily average" value={formatDuration(avgSeconds)} />
    </div>
  );
}
