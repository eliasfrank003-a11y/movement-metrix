import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { HABIT_COLORS, DEFAULT_COLOR } from '@/lib/types';

interface AddHabitFormProps {
  onCreate: (input: { name: string; color: string; weeklyTarget: number }) => Promise<void>;
}

export function AddHabitForm({ onCreate }: AddHabitFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setName('');
    setColor(DEFAULT_COLOR);
    setWeeklyTarget(3);
    setError(null);
  };

  const handleSubmit = async () => {
    if (name.trim().length === 0) {
      setError('Give it a name.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onCreate({ name: name.trim(), color, weeklyTarget });
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add habit.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Plus className="h-4 w-4" /> Add habit
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">New habit</h3>
        <button
          onClick={() => { reset(); setOpen(false); }}
          aria-label="Cancel"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="Running, gym, swimming…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
        />

        <div>
          <label className="text-xs text-muted-foreground">Colour</label>
          <div className="mt-1.5 flex gap-2">
            {Object.entries(HABIT_COLORS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setColor(key)}
                aria-label={key}
                aria-pressed={color === key}
                className={`h-7 w-7 rounded-full ${value.dot} ${
                  color === key ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Days per week</label>
          <div className="mt-1.5 flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => setWeeklyTarget(n)}
                aria-pressed={weeklyTarget === n}
                className={`h-8 w-8 rounded-lg border text-sm transition-colors ${
                  weeklyTarget === n
                    ? 'border-transparent bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="rounded-lg bg-foreground px-3 py-2 text-sm text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? 'Adding…' : 'Add habit'}
        </button>
      </div>
    </div>
  );
}
