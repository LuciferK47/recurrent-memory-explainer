import { Rect } from '../../lib/layout';
import { PANEL_FILL, GRID_LINE, MEMORY, TRUTH, INTERFERENCE, rgba } from './theme';

// Exported so StageOverlay.tsx's legend text reads this value instead of
// carrying its own separately hardcoded copy that could silently drift.
export const EDGE_THRESHOLD = 0.12; // only draw edges above this normalized magnitude, or a d=32 graph is unreadable noise
const MARGIN = 14;

/**
 * The same live matrix as draw-matrix.ts, drawn as a bipartite key -> value
 * graph rather than a grid — BDH's own "neuron-synapse" framing (see
 * BDHModule's architecture card) applied to the real, shared memory store
 * rather than a fabricated illustration. Node radius scales with total
 * connection strength, echoing the scale-free / hub language BDH uses.
 */
export function drawSynapseGraph(
  ctx: CanvasRenderingContext2D,
  display: Float32Array,
  dim: number,
  frame: Rect,
  opacity: number,
  maxAbs: number
): void {
  if (opacity <= 0 || frame.w <= 0 || frame.h <= 0) return;

  const denom = maxAbs > 1e-6 ? maxAbs : 1;
  const usableH = Math.max(0, frame.h - MARGIN * 2);
  const keyX = frame.x + MARGIN;
  const valX = frame.x + frame.w - MARGIN;
  const step = dim > 1 ? usableH / (dim - 1) : 0;
  const yFor = (i: number) => frame.y + MARGIN + i * step;

  const keyStrength = new Float32Array(dim);
  const valStrength = new Float32Array(dim);
  for (let i = 0; i < dim; i++) {
    const rowOff = i * dim;
    for (let j = 0; j < dim; j++) {
      const a = Math.abs(display[rowOff + j]) / denom;
      keyStrength[j] += a;
      valStrength[i] += a;
    }
  }
  let maxKeyS = 1e-6;
  let maxValS = 1e-6;
  for (let j = 0; j < dim; j++) maxKeyS = Math.max(maxKeyS, keyStrength[j]);
  for (let i = 0; i < dim; i++) maxValS = Math.max(maxValS, valStrength[i]);

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.fillStyle = PANEL_FILL;
  ctx.fillRect(frame.x, frame.y, frame.w, frame.h);

  ctx.lineWidth = 1.2;
  for (let i = 0; i < dim; i++) {
    const rowOff = i * dim;
    for (let j = 0; j < dim; j++) {
      const norm = display[rowOff + j] / denom;
      const a = Math.abs(norm);
      if (a < EDGE_THRESHOLD) continue;
      const alpha = Math.min(0.85, 0.25 + a * 0.6);
      ctx.strokeStyle = norm >= 0 ? rgba(MEMORY, alpha) : rgba(INTERFERENCE, alpha);
      ctx.beginPath();
      ctx.moveTo(keyX, yFor(j));
      ctx.lineTo(valX, yFor(i));
      ctx.stroke();
    }
  }

  for (let j = 0; j < dim; j++) {
    const r = 2.5 + 3.5 * (keyStrength[j] / maxKeyS);
    ctx.fillStyle = rgba(MEMORY, 1);
    ctx.beginPath();
    ctx.arc(keyX, yFor(j), r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < dim; i++) {
    const r = 2.5 + 3.5 * (valStrength[i] / maxValS);
    ctx.fillStyle = rgba(TRUTH, 1);
    ctx.beginPath();
    ctx.arc(valX, yFor(i), r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(frame.x + 0.5, frame.y + 0.5, frame.w - 1, frame.h - 1);
  ctx.restore();
}
