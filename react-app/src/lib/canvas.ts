/**
 * Stage coordinate system: a fixed 1000x640 unit space. The canvas installs
 * a transform mapping stage units -> device pixels; the SVG overlay uses
 * `viewBox="0 0 1000 640"`, so stage units ARE its user units — a label at
 * `layout.matrix.frame.x` lands exactly on the canvas cell it annotates, at
 * native (crisp, selectable) text quality. This is the direct fix for the
 * legacy MemoryLab canvas, which drew 9px monospace text into the bitmap
 * itself.
 */

export const STAGE_W = 1000;
export const STAGE_H = 640;

/**
 * Resize the canvas backing store to match its CSS box at the current
 * devicePixelRatio (capped — a 3x display gains nothing perceptible on a
 * heatmap but triples fill cost) and install the stage-unit transform.
 * Returns true if the backing store's pixel dimensions actually changed
 * (assigning `.width`/`.height` clears the bitmap, so the caller must force
 * a full redraw when this is true).
 */
export function syncSurface(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  maxDpr = 2
): boolean {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const backingW = Math.round(cssW * dpr);
  const backingH = Math.round(cssH * dpr);
  let changed = false;
  if (canvas.width !== backingW) {
    canvas.width = backingW;
    changed = true;
  }
  if (canvas.height !== backingH) {
    canvas.height = backingH;
    changed = true;
  }
  const scale = (cssW / STAGE_W) * dpr;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return changed;
}
