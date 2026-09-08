/**
 * Scene 3 — the synaptic graph. The matrix frame widens from MATRIX_TARGET
 * (the square heatmap footprint) to GRAPH_TARGET (a wide frame sized for a
 * bipartite diagram, not a d*d grid) as `graphness` goes 0->1, using the same
 * lerpRect machinery `resolveLayout.ts` already applies to every other Rect
 * field — so the grid visibly expands into the graph rather than the graph
 * being squeezed into the grid's square. draw-matrix.ts/draw-graph.ts
 * crossfade at whatever frame results, same as before.
 */
import { StageLayout, MATRIX_TARGET, GRAPH_TARGET, lerpRect, collapsedMatrixRect, collapsedPlotRect } from '../../lib/layout';
import { clamp01, smoothstep } from '../../lib/easing';

export function layoutFor(p: number): StageLayout {
  const graphT = smoothstep(clamp01(p / 0.2));
  return {
    matrix: {
      frame: lerpRect(MATRIX_TARGET, GRAPH_TARGET, graphT),
      opacity: 1,
      gutterOpacity: 0,
      graphness: graphT,
    },
    kvBuffer: { frame: collapsedMatrixRect(), opacity: 0 },
    plot: { frame: collapsedPlotRect(), opacity: 0 },
    captionOpacity: 1,
  };
}
