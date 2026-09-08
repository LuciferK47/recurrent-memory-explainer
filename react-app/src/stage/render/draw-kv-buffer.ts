import { Rect } from '../../lib/layout';
import { INTERFERENCE, rgba } from './theme';

/** The expanding O(n) KV-cache buffer — a widening bar with tick marks suggesting discrete appended tokens. */
export function drawKvBuffer(ctx: CanvasRenderingContext2D, frame: Rect, opacity: number): void {
  if (opacity <= 0 || frame.w <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.fillStyle = rgba(INTERFERENCE, 0.12);
  ctx.fillRect(frame.x, frame.y, frame.w, frame.h);

  ctx.strokeStyle = rgba(INTERFERENCE, 0.4);
  ctx.lineWidth = 1;
  const tickSpacing = 18;
  ctx.beginPath();
  for (let x = frame.x + tickSpacing; x < frame.x + frame.w - 2; x += tickSpacing) {
    ctx.moveTo(x, frame.y + 4);
    ctx.lineTo(x, frame.y + frame.h - 4);
  }
  ctx.stroke();

  ctx.strokeStyle = rgba(INTERFERENCE, 0.75);
  ctx.strokeRect(frame.x + 0.5, frame.y + 0.5, frame.w - 1, frame.h - 1);

  // Leading edge, to read as "still growing".
  ctx.fillStyle = rgba(INTERFERENCE, 0.9);
  ctx.fillRect(frame.x + frame.w - 3, frame.y, 3, frame.h);

  ctx.restore();
}
