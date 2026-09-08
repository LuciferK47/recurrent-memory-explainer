import React, { useEffect, useRef, useState } from 'react';
import { useMemorySelector } from '../state/memory-store';

/**
 * A single, always-mounted `aria-live` region that announces every write
 * (or clear) into the shared memory matrix — regardless of which control
 * caused it: MemoryLab's random/custom/θ-angle writes, BDHModule's η/λ
 * decay write, Stage's Flood button, all funnel through the same
 * store.addPair, so one subscriber here covers every one of them instead of
 * wiring an announcement into each button individually.
 *
 * Debounced: a handler that calls addPair many times synchronously (Flood
 * adds 20 in one loop) already batches into one React re-render under
 * React 18's automatic batching, but the debounce is cheap insurance
 * against rapid separate clicks (e.g. mashing "+1 Pair") coalescing into
 * one announcement instead of a flood of interruptions.
 */
export const WriteAnnouncer: React.FC = () => {
  const pairs = useMemorySelector(s => s.pairs);
  const dim = useMemorySelector(s => s.dim);
  const [announcement, setAnnouncement] = useState('');
  const prevLenRef = useRef(pairs.length);

  useEffect(() => {
    const prevLen = prevLenRef.current;
    prevLenRef.current = pairs.length;
    if (pairs.length === prevLen) return;

    const timer = setTimeout(() => {
      if (pairs.length === 0) {
        setAnnouncement('Memory cleared. 0 pairs stored.');
      } else if (pairs.length > prevLen) {
        const added = pairs.length - prevLen;
        setAnnouncement(
          added === 1
            ? `Wrote "${pairs[pairs.length - 1].label || 'association'}" into memory. ${pairs.length} of ${dim} slots used.`
            : `Wrote ${added} new associations into memory. ${pairs.length} of ${dim} slots used.`
        );
      } else {
        setAnnouncement(`Dimension changed. ${pairs.length} of ${dim} slots used.`);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [pairs, dim]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
};
