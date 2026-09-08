import { Rect } from '../../lib/layout';
import { rgba, INK } from './theme';

/**
 * Outline the hovered/focused cell for the cell inspector. Drawn on the
 * canvas (not SVG) so it composites directly with the heatmap it's
 * annotating, at whatever frame the matrix currently occupies.
 *
 * A light ink ring with a dark halo behind it, rather than a plain light
 * glow — a light outline all but disappears against the panel's own bright
 * cells (memory blue, interference red are both fairly saturated), so it
 * needs a stroke that reads on both the dark panel fill and every cell
 * color: a soft dark shadow first, then a crisp light ring on top.
 */
export function drawCellHighlight(ctx: CanvasRenderingContext2D, frame: Rect, dim: number, cell: { r: number; c: number }): void {
  if (dim <= 0) return;
  const cellW = frame.w / dim;
  const cellH = frame.h / dim;
  const x = frame.x + cell.c * cellW;
  const y = frame.y + cell.r * cellH;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 5;
  ctx.strokeStyle = rgba(INK, 0.92);
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(INK, 0.92);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
  ctx.restore();
}
