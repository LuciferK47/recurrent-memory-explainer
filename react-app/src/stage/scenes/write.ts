/**
 * Scene 2 — writing an association. The matrix sits at its permanent
 * position (MATRIX_TARGET); the v/k^T gutter swatches fade in at scene
 * start. The actual outer-product beam sequence is independent of scroll
 * position — it plays whenever the shared memory store receives a new pair,
 * live, regardless of where in this scene the reader currently is (see
 * stage/render/write-anim.ts and Stage.tsx).
 */
import { StageLayout, MATRIX_TARGET, collapsedMatrixRect, collapsedPlotRect } from '../../lib/layout';
import { clamp01, smoothstep } from '../../lib/easing';

export function layoutFor(p: number): StageLayout {
  const gutterT = smoothstep(clamp01(p / 0.15));
  return {
    matrix: {
      frame: MATRIX_TARGET,
      opacity: 1,
      gutterOpacity: gutterT,
      graphness: 0,
    },
    kvBuffer: {
      frame: collapsedMatrixRect(),
      opacity: 0,
    },
    plot: { frame: collapsedPlotRect(), opacity: 0 },
    captionOpacity: 1,
  };
}
