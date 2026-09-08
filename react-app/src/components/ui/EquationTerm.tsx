import React, { useEffect, useRef } from 'react';
import { useMemoryStore, TermAxis } from '../../state/memory-store';

const AXIS_CLASSES: Record<TermAxis, string[]> = {
  v: ['bg-memory/20', 'text-memory', 'ring-1', 'ring-memory/50'],
  k: ['bg-truth/20', 'text-truth', 'ring-1', 'ring-truth/50'],
  m: ['bg-synapse/20', 'text-synapse', 'ring-1', 'ring-synapse/50'],
};

const AXIS_DESCRIPTION: Record<TermAxis, string> = {
  v: 'the value vector — highlights the row axis on the matrix diagram',
  k: 'the key/query vector — highlights the column axis on the matrix diagram',
  m: 'the whole memory matrix — highlights it on the diagram',
};

interface EquationTermProps {
  axis: TermAxis;
  children: React.ReactNode;
  className?: string;
}

/**
 * One term inside a live equation (v, k/q, or M/S) that bidirectionally
 * links to the Stage's matrix diagram: hovering or focusing it highlights
 * the region it corresponds to there, and hovering that region on the
 * canvas highlights every instance of this term back (every EquationTerm
 * mounted anywhere on the page shares one store.termHighlight ref, so they
 * all light up together — MemoryLab's "v" and BDHModule's "v(t)" included).
 *
 * Goes entirely through store.termHighlight + requestRender/onRenderRequest
 * — never React state — because the "vice versa" direction is driven by
 * canvas pointermove while crossing the gutter zones, which the three-tier
 * rule in memory-store.ts calls out as 60Hz-adjacent.
 */
export const EquationTerm: React.FC<EquationTermProps> = ({ axis, children, className }) => {
  const store = useMemoryStore();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sync = () => {
      const el = ref.current;
      if (!el) return;
      const active = store.termHighlight.current === axis;
      for (const c of AXIS_CLASSES[axis]) el.classList.toggle(c, active);
    };
    sync();
    return store.onRenderRequest(sync);
  }, [store, axis]);

  const set = () => {
    store.termHighlight.current = axis;
    store.requestRender();
  };
  const clear = () => {
    if (store.termHighlight.current === axis) {
      store.termHighlight.current = null;
      store.requestRender();
    }
  };

  return (
    <span
      ref={ref}
      tabIndex={0}
      data-axis={axis}
      aria-label={AXIS_DESCRIPTION[axis]}
      onMouseEnter={set}
      onMouseLeave={clear}
      onFocus={set}
      onBlur={clear}
      className={`rounded px-0.5 cursor-help transition-colors outline-none focus-visible:ring-2 focus-visible:ring-current ${className ?? ''}`}
    >
      {children}
    </span>
  );
};
