/**
 * Scene 1 — the growing KV cache. A widening horizontal buffer (O(n)) fades
 * out as the fixed-size matrix (O(1)) grows in from a point at the exact
 * position it will occupy for the rest of the Stage's life (see
 * lib/layout.ts MATRIX_TARGET) — so the transition into the `write` scene is
 * a continuation, never a jump.
 */
import { StageLayout, lerpRect, MATRIX_TARGET, collapsedMatrixRect, collapsedPlotRect } from '../../lib/layout';
import { clamp01, smoothstep } from '../../lib/easing';

const BUFFER_GROW_END = 0.7; // buffer finishes widening by 70% through the scene
const MATRIX_GROW_START = 0.6; // matrix starts growing in at 60%, overlapping the buffer's fade

export function layoutFor(p: number): StageLayout {
  const growT = smoothstep(clamp01((p - MATRIX_GROW_START) / (1 - MATRIX_GROW_START)));
  const fadeT = p < BUFFER_GROW_END ? 0 : smoothstep((p - BUFFER_GROW_END) / (1 - BUFFER_GROW_END));

  return {
    matrix: {
      frame: lerpRect(collapsedMatrixRect(), MATRIX_TARGET, growT),
      opacity: growT,
      gutterOpacity: 0,
      graphness: 0,
    },
    kvBuffer: {
      frame: { x: 60, y: 280, w: 100 + 760 * clamp01(p / BUFFER_GROW_END), h: 60 },
      opacity: 1 - fadeT,
    },
    plot: { frame: collapsedPlotRect(), opacity: 0 },
    captionOpacity: 1,
  };
}
