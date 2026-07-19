import { useRef, useState, type ReactNode } from 'react';

interface SwipeDeckProps {
  pages: { id: string; content: ReactNode }[];
}

/**
 * Horizontal pager. Only one page exists today, but the gesture and the dots
 * are in place so adding a second skill is a data change, not a rewrite.
 */
export function SwipeDeck({ pages }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const [delta, setDelta] = useState(0);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  // Locks to one axis on first movement so vertical scrolling never drags the pager.
  const axisRef = useRef<'x' | 'y' | null>(null);

  const handleStart = (e: React.TouchEvent) => {
    startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    axisRef.current = null;
  };

  const handleMove = (e: React.TouchEvent) => {
    if (!startRef.current) return;
    const dx = e.touches[0].clientX - startRef.current.x;
    const dy = e.touches[0].clientY - startRef.current.y;

    if (!axisRef.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (axisRef.current !== 'x') return;

    // Resist dragging past the ends.
    const atEdge = (dx > 0 && index === 0) || (dx < 0 && index === pages.length - 1);
    setDelta(atEdge ? dx * 0.25 : dx);
  };

  const handleEnd = () => {
    if (axisRef.current === 'x' && Math.abs(delta) > 60) {
      setIndex((i) => Math.min(pages.length - 1, Math.max(0, i - Math.sign(delta))));
    }
    setDelta(0);
    startRef.current = null;
    axisRef.current = null;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="flex"
        style={{
          width: `${pages.length * 100}%`,
          transform: `translateX(calc(${-index * (100 / pages.length)}% + ${delta}px))`,
          transition: delta === 0 ? 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {pages.map((page) => (
          <div key={page.id} style={{ width: `${100 / pages.length}%` }}>
            {page.content}
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center gap-1.5">
          {pages.map((page, i) => (
            <span
              key={page.id}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === index ? 'bg-foreground' : 'bg-border'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
