/**
 * Scene 4 — the interference cliff. The matrix/graph recedes; a recall-vs-n
 * plot takes the stage, built live from the shared store's write history
 * (see Stage.tsx's cliffHistoryRef) — reacting to every write made anywhere
 * in this explainer, not a separate flood experiment with its own memory.
 * The automatic scene-boundary blend (resolveStageLayout) handles the
 * crossfade from synapse's graph into this plot; nothing here animates on
 * its own local progress.
 */
import { StageLayout, PLOT_TARGET, collapsedMatrixRect } from '../../lib/layout';

export function layoutFor(_p: number): StageLayout {
  return {
    matrix: {
      frame: collapsedMatrixRect(),
      opacity: 0,
      gutterOpacity: 0,
      graphness: 1,
    },
    kvBuffer: { frame: collapsedMatrixRect(), opacity: 0 },
    plot: { frame: PLOT_TARGET, opacity: 1 },
    captionOpacity: 1,
  };
}
