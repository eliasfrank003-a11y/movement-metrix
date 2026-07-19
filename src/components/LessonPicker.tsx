import { MONTHS, WEEKS_PER_MONTH, type Lesson } from '@/lib/program';

interface LessonPickerProps {
  /** Lesson tagged on the most recent session, if any. */
  current: Lesson | null;
  onPick: (lesson: Lesson) => void;
}

/**
 * A 4x4 grid mirroring the programme's shape - four months down, four weeks
 * across - so picking a lesson is spatial rather than a dropdown.
 */
export function LessonPicker({ current, onPick }: LessonPickerProps) {
  return (
    <section>
      <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Today's lesson
      </h2>

      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: MONTHS }, (_, mi) =>
          Array.from({ length: WEEKS_PER_MONTH }, (_, wi) => {
            const lesson = { month: mi + 1, week: wi + 1 };
            const active = current?.month === lesson.month && current?.week === lesson.week;
            return (
              <button
                key={`${lesson.month}-${lesson.week}`}
                onClick={() => onPick(lesson)}
                aria-pressed={active}
                className={`rounded-md py-2 text-[11px] tabular-nums transition-colors ${
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
  );
}
