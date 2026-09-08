import { STAGE_W, STAGE_H } from '../../lib/canvas';
import { INK, PANEL_FILL, ON_PANEL } from './theme';

export const LOUPE_RADIUS = 68;
export const LOUPE_ZOOM = 3.2;
const LOUPE_OFFSET = 92; // stage units, up-left of the sampled point so the glass never covers the cursor it's magnifying

/**
 * A magnifying glass for any stage-unit renderer: clips a circle, then
 * re-runs `draw` (the same function the base pass already called) under a
 * transform that samples around (sampleX, sampleY) but displays the result
 * centered at a point offset up-left of it — so the loupe never sits on top
 * of the cursor it's magnifying. Because every Stage renderer draws
 * procedurally in stage units rather than blitting pixels, the magnified
 * view is genuinely vector-crisp at any zoom, not a blurry pixel sample.
 */
export function drawLoupe(
  ctx: CanvasRenderingContext2D,
  sampleX: number,
  sampleY: number,
  draw: () => void,
  radius: number = LOUPE_RADIUS,
  zoom: number = LOUPE_ZOOM
): { displayX: number; displayY: number } {
  const displayX = Math.max(radius + 4, Math.min(STAGE_W - radius - 4, sampleX - LOUPE_OFFSET));
  const displayY = Math.max(radius + 4, Math.min(STAGE_H - radius - 4, sampleY - LOUPE_OFFSET));

  ctx.save();
  ctx.beginPath();
  ctx.arc(displayX, displayY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = PANEL_FILL;
  ctx.fillRect(displayX - radius, displayY - radius, radius * 2, radius * 2);
  ctx.translate(displayX, displayY);
  ctx.scale(zoom, zoom);
  ctx.translate(-sampleX, -sampleY);
  draw();
  ctx.restore();

  // Halo ring — light for separation against any background, then a thin
  // ink hairline on top so it still reads a crisp edge on the brightest
  // cells. A dashed radial line marks the sampled point so the connection
  // between glass and source is legible.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(sampleX, sampleY);
  ctx.lineTo(displayX, displayY);
  ctx.strokeStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},0.25)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(displayX, displayY, radius, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = ON_PANEL;
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},0.3)`;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(sampleX, sampleY, 3, 0, Math.PI * 2);
  ctx.fillStyle = ON_PANEL;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},0.4)`;
  ctx.stroke();
  ctx.restore();

  return { displayX, displayY };
}

export function pointInRect(pt: { x: number; y: number }, frame: { x: number; y: number; w: number; h: number }, margin = 0): boolean {
  return pt.x >= frame.x - margin && pt.x <= frame.x + frame.w + margin && pt.y >= frame.y - margin && pt.y <= frame.y + frame.h + margin;
}
