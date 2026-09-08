import { Rect } from '../../lib/layout';
import { clamp01, easeOutCubic } from '../../lib/easing';
import { WriteAnim, T_ARRIVE, T_CHARGE, T_BEAM_END, TOTAL_MS, BEAM_STAGGER_BUDGET, BEAM_DUR } from './write-anim';
import { MEMORY, TRUTH, INTERFERENCE, ON_PANEL, rgba } from './theme';

export const GUTTER = 26; // px: gutter thickness and slide-in travel distance — also the equation<->diagram v/k hover-zone width (see draw-term-highlight.ts)

/**
 * The v (left) / k^T (top) gutter swatches, plus the crossing beam sweep
 * during the beam phase. On the panel's old dark ground this used additive
 * ('lighter') blending for the glow; against the paper panel additive
 * blending toward white just fades to invisible, so the beam is a solid
 * gradient-tipped stroke with a `shadowBlur` glow under normal ('source-over')
 * compositing instead — reads the same "energized" way on light or dark.
 */
export function drawWriteEffects(ctx: CanvasRenderingContext2D, dim: number, frame: Rect, anim: WriteAnim, now: number): void {
  const t = (now - anim.t0) * anim.speed;
  if (t > TOTAL_MS) return;

  const cellW = frame.w / dim;
  const cellH = frame.h / dim;
  const arriveT = easeOutCubic(clamp01(t / T_ARRIVE));
  const chargeT = clamp01((t - T_ARRIVE) / (T_CHARGE - T_ARRIVE));
  const settleFade = t < T_BEAM_END ? 1 : 1 - clamp01((t - T_BEAM_END) / (TOTAL_MS - T_BEAM_END)) * 0.65;
  const slideOffset = GUTTER * (1 - arriveT);

  ctx.save();
  for (let i = 0; i < dim; i++) {
    const barLen = GUTTER * anim.vAbs[i] * chargeT;
    const alpha = 0.9 * settleFade;
    ctx.fillStyle = anim.vSign[i] >= 0 ? rgba(MEMORY, alpha) : rgba(INTERFERENCE, alpha);
    ctx.fillRect(frame.x - slideOffset - barLen, frame.y + i * cellH + 2, barLen, cellH - 4);
  }
  for (let j = 0; j < dim; j++) {
    const barLen = GUTTER * anim.kAbs[j] * chargeT;
    const alpha = 0.9 * settleFade;
    ctx.fillStyle = anim.kSign[j] >= 0 ? rgba(TRUTH, alpha) : rgba(INTERFERENCE, alpha);
    ctx.fillRect(frame.x + j * cellW + 2, frame.y - slideOffset - barLen, cellW - 4, barLen);
  }
  ctx.restore();

  if (t <= T_CHARGE || t >= T_BEAM_END) return;

  const stagger = BEAM_STAGGER_BUDGET / Math.max(1, dim - 1);
  ctx.save();
  ctx.lineWidth = 2.4;

  for (let i = 0; i < dim; i++) {
    const hProgress = clamp01((t - T_CHARGE - i * stagger) / BEAM_DUR);
    if (hProgress <= 0 || hProgress >= 1) continue;
    const y = frame.y + (i + 0.5) * cellH;
    const xEnd = frame.x + hProgress * frame.w;
    const grad = ctx.createLinearGradient(frame.x, y, xEnd, y);
    grad.addColorStop(0, rgba(MEMORY, 0));
    grad.addColorStop(1, rgba(MEMORY, 0.9));
    ctx.shadowColor = rgba(MEMORY, 0.5);
    ctx.shadowBlur = 6;
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(frame.x, y);
    ctx.lineTo(xEnd, y);
    ctx.stroke();
    // Bright leading-edge dot with a panel-colored halo — the thin line alone
    // reads too faint against a busy heatmap.
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.fillStyle = ON_PANEL;
    ctx.arc(xEnd, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = rgba(MEMORY, 1);
    ctx.arc(xEnd, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let j = 0; j < dim; j++) {
    const vProgress = clamp01((t - T_CHARGE - j * stagger) / BEAM_DUR);
    if (vProgress <= 0 || vProgress >= 1) continue;
    const x = frame.x + (j + 0.5) * cellW;
    const yEnd = frame.y + vProgress * frame.h;
    const grad = ctx.createLinearGradient(x, frame.y, x, yEnd);
    grad.addColorStop(0, rgba(TRUTH, 0));
    grad.addColorStop(1, rgba(TRUTH, 0.9));
    ctx.shadowColor = rgba(TRUTH, 0.5);
    ctx.shadowBlur = 6;
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, frame.y);
    ctx.lineTo(x, yEnd);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.fillStyle = ON_PANEL;
    ctx.arc(x, yEnd, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = rgba(TRUTH, 1);
    ctx.arc(x, yEnd, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
