import { useEffect, useRef } from 'react';

/**
 * Wires a stage box element to a ResizeObserver (backing-store resync) and a
 * combined IntersectionObserver + document-visibility gate. Both callbacks
 * fire outside React state — the caller (Stage.tsx) feeds them straight into
 * the rAF loop's `setActive`/`request`, never into `useState`.
 */
export function useStageSurface(
  boxRef: React.RefObject<HTMLElement | null>,
  onVisibilityChange: (visible: boolean) => void,
  onResize: () => void
): void {
  const intersectingRef = useRef(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const publishVisibility = () => onVisibilityChange(intersectingRef.current && !document.hidden);

    const ro = new ResizeObserver(() => onResize());
    ro.observe(box);

    const io = new IntersectionObserver(
      entries => {
        const entry = entries[entries.length - 1];
        intersectingRef.current = !!entry?.isIntersecting;
        publishVisibility();
      },
      { rootMargin: '200px 0px' }
    );
    io.observe(box);

    document.addEventListener('visibilitychange', publishVisibility);

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', publishVisibility);
    };
    // Runs once on mount against the box this Stage instance rendered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
