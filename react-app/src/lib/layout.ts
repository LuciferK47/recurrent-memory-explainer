import { lerp } from './easing';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StageLayout {
  matrix: {
    frame: Rect;
    opacity: number;
    /** The v (left) / k^T (top) gutter swatches used by the write animation. */
    gutterOpacity: number;
    /** 0 = grid heatmap, 1 = bipartite synaptic graph — the two renderers crossfade at the same frame rather than replacing one another. */
    graphness: number;
  };
  kvBuffer: {
    frame: Rect;
    opacity: number;
  };
  /** The interference-cliff recall-vs-n plot (cliff scene only). */
  plot: {
    frame: Rect;
    opacity: number;
  };
  captionOpacity: number;
}

export function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) };
}

export function lerpLayout(a: StageLayout, b: StageLayout, t: number): StageLayout {
  return {
    matrix: {
      frame: lerpRect(a.matrix.frame, b.matrix.frame, t),
      opacity: lerp(a.matrix.opacity, b.matrix.opacity, t),
      gutterOpacity: lerp(a.matrix.gutterOpacity, b.matrix.gutterOpacity, t),
      graphness: lerp(a.matrix.graphness, b.matrix.graphness, t),
    },
    kvBuffer: {
      frame: lerpRect(a.kvBuffer.frame, b.kvBuffer.frame, t),
      opacity: lerp(a.kvBuffer.opacity, b.kvBuffer.opacity, t),
    },
    plot: {
      frame: lerpRect(a.plot.frame, b.plot.frame, t),
      opacity: lerp(a.plot.opacity, b.plot.opacity, t),
    },
    captionOpacity: lerp(a.captionOpacity, b.captionOpacity, t),
  };
}

/** The one fixed position the matrix occupies from the moment it exists (kv-cache's grow-in target) through the write scene — so no transition into it ever jumps. Enlarged from the original 240x240 (9% of the 1000x640 stage) to actually fill the panel and make cell values legible without the loupe. */
export const MATRIX_TARGET: Rect = { x: 360, y: 110, w: 380, h: 380 };

/** The synapse scene's frame — the bipartite key->value graph is wide, not square, so it gets its own target rather than inheriting the heatmap's square footprint (which squeezed it into a fraction of the panel with the graph's node columns almost touching). `synapse.ts` lerps `matrix.frame` from MATRIX_TARGET to this as graphness goes 0->1, reusing lerpLayout's existing per-field interpolation — the grid visibly widens into the graph rather than swapping frames. */
export const GRAPH_TARGET: Rect = { x: 150, y: 110, w: 700, h: 400 };

/** The interference-cliff plot's frame — wider than the matrix since nothing else shares the stage in that scene. */
export const PLOT_TARGET: Rect = { x: 130, y: 110, w: 740, h: 380 };

export function collapsedMatrixRect(): Rect {
  const cx = MATRIX_TARGET.x + MATRIX_TARGET.w / 2;
  const cy = MATRIX_TARGET.y + MATRIX_TARGET.h / 2;
  return { x: cx, y: cy, w: 0, h: 0 };
}

export function collapsedPlotRect(): Rect {
  const cx = PLOT_TARGET.x + PLOT_TARGET.w / 2;
  const cy = PLOT_TARGET.y + PLOT_TARGET.h / 2;
  return { x: cx, y: cy, w: 0, h: 0 };
}
