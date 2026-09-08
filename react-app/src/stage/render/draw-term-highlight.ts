import { Rect } from '../../lib/layout';
import { TermAxis } from '../../state/memory-store';
import { GUTTER } from './draw-beams';
import { MEMORY, TRUTH, SYNAPSE, rgba } from './theme';

/**
 * Equation<->diagram linking: hovering/focusing the v, k, or M/S term in an
 * equation (MemoryLab, BDHModule) — or the matching zone on the canvas
 * itself — highlights the region that term corresponds to: v is the row
 * axis (left gutter), k is the column axis (top gutter), M/S is the whole
 * matrix. Same colors and gutter width as the write-beam animation
 * (draw-beams.ts) so the mapping reads as one consistent visual language.
 */
export function drawTermHighlight(ctx: CanvasRenderingContext2D, frame: Rect, axis: TermAxis): void {
  ctx.save();
  if (axis === 'v') {
    ctx.fillStyle = rgba(MEMORY, 0.16);
    ctx.fillRect(frame.x - GUTTER, frame.y, GUTTER, frame.h);
    ctx.strokeStyle = rgba(MEMORY, 0.85);
    ctx.lineWidth = 2;
    ctx.strokeRect(frame.x - GUTTER + 1, frame.y + 1, GUTTER - 2, frame.h - 2);
  } else if (axis === 'k') {
    ctx.fillStyle = rgba(TRUTH, 0.16);
    ctx.fillRect(frame.x, frame.y - GUTTER, frame.w, GUTTER);
    ctx.strokeStyle = rgba(TRUTH, 0.85);
    ctx.lineWidth = 2;
    ctx.strokeRect(frame.x + 1, frame.y - GUTTER + 1, frame.w - 2, GUTTER - 2);
  } else {
    ctx.shadowColor = rgba(SYNAPSE, 0.55);
    ctx.shadowBlur = 10;
    ctx.strokeStyle = rgba(SYNAPSE, 0.9);
    ctx.lineWidth = 2.5;
    ctx.strokeRect(frame.x + 1, frame.y + 1, frame.w - 2, frame.h - 2);
  }
  ctx.restore();
}
