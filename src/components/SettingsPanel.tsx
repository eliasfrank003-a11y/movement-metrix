import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { supabase } from '@/lib/store/supabaseStore';
import { MONTHS, WEEKS_PER_MONTH, type Lesson } from '@/lib/program';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  /** The lesson newly clocked days inherit. */
  activeLesson: Lesson | null;
  onSelectLesson: (lesson: Lesson) => void;
  onSynced: () => void;
}

/**
 * Kept out of the movement view on purpose: the lesson is a setting you change
 * every couple of weeks, not something to touch daily. Days inherit whatever is
 * active here at the moment they're clocked.
 */
export function SettingsPanel({
  open,
  onClose,
  activeLesson,
  onSelectLesson,
  onSynced,
}: SettingsPanelProps) {
  const [syncState, setSyncState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!open) return null;

  const runSync = async () => {
    if (!supabase) {
      setSyncState('error');
      setSyncMessage('Not connected to the database.');
      return;
    }
    setSyncState('running');
    setSyncMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calendar');
      if (error) throw new Error(error.message);
      setSyncState('done');
      setSyncMessage(`${data?.created ?? 0} new, ${data?.updated ?? 0} updated`);
      onSynced();
    } catch (err) {
      setSyncState('error');
      setSyncMessage(err instanceof Error ? err.message : 'Sync failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="mx-auto max-w-md px-5 pb-20 pt-8">
        <header className="mb-8 flex items-start justify-between">
          <h1 className="text-[26px] font-semibold tracking-tight">Settings</h1>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <section>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Current lesson
          </h2>
          <p className="mb-4 mt-1.5 text-xs text-muted-foreground">
            Every day you clock in counts toward this until you change it.
          </p>

          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: MONTHS }, (_, mi) =>
              Array.from({ length: WEEKS_PER_MONTH }, (_, wi) => {
                const lesson = { month: mi + 1, week: wi + 1 };
                const active =
                  activeLesson?.month === lesson.month && activeLesson?.week === lesson.week;
                return (
                  <button
                    key={`${lesson.month}-${lesson.week}`}
                    onClick={() => onSelectLesson(lesson)}
                    aria-pressed={active}
                    className={`rounded-md py-2.5 text-[11px] tabular-nums transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lesson.month}·{lesson.week}
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Calendar
          </h2>
          <p className="mb-4 mt-1.5 text-xs text-muted-foreground">
            Pulls the last 90 days from your Movement calendar and fills in the times.
          </p>

          <button
            onClick={runSync}
            disabled={syncState === 'running'}
            className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted/70 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncState === 'running' ? 'animate-spin' : ''}`} />
            {syncState === 'running' ? 'Syncing…' : 'Sync now'}
          </button>

          {syncMessage && (
            <p
              className={`mt-2 text-xs ${
                syncState === 'error' ? 'text-day-missed' : 'text-muted-foreground'
              }`}
            >
              {syncMessage}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
