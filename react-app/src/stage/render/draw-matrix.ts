import { Rect } from '../../lib/layout';
import { colormapFor } from '../../lib/colormap';
import { PANEL_FILL, GRID_LINE } from './theme';

/** The one heatmap renderer shared by every scene that shows the matrix. */
export function drawMatrix(
  ctx: CanvasRenderingContext2D,
  display: Float32Array,
  dim: number,
  frame: Rect,
  opacity: number,
  maxAbs: number
): void {
  if (opacity <= 0 || frame.w <= 0 || frame.h <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.fillStyle = PANEL_FILL;
  ctx.fillRect(frame.x, frame.y, frame.w, frame.h);

  const cellW = frame.w / dim;
  const cellH = frame.h / dim;
  const pad = dim <= 8 ? 1.5 : dim <= 16 ? 1 : 0.5;
  const denom = maxAbs > 1e-6 ? maxAbs : 1;

  for (let i = 0; i < dim; i++) {
    const rowOff = i * dim;
    const y = frame.y + i * cellH;
    for (let j = 0; j < dim; j++) {
      const norm = display[rowOff + j] / denom;
      ctx.fillStyle = colormapFor(norm);
      ctx.fillRect(frame.x + j * cellW + pad, y + pad, cellW - pad * 2, cellH - pad * 2);
    }
  }

  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(frame.x + 0.5, frame.y + 0.5, frame.w - 1, frame.h - 1);
  ctx.restore();
}
