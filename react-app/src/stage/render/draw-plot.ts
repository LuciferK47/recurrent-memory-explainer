import { Rect } from '../../lib/layout';
import { PANEL_FILL, ON_PANEL, GRID_LINE, GRID_LINE_SOFT, INK, MEMORY, TRUTH, DATA, INTERFERENCE, rgba } from './theme';

export interface CliffPoint {
  n: number;
  recall: number;
}

/** One point of the precomputed Monte Carlo sweep (data/interference_sweep.json) for the current dimension — evidence-discipline distinct from the live trace: CLAUDE.md §4.3 requires precomputed simulation stay visually separate from the live substrate, never blurred together. */
export interface SweepBandPoint {
  n: number;
  mean: number;
  std: number;
}

/** The live recall-vs-n plot for the cliff scene — same chart shape as Breaking Point's retired live chart, driven by the shared store's write history (Stage.tsx's cliffHistoryRef). `band`, when given, draws the precomputed sweep's mean+-std as a dashed line and soft ribbon underneath the live trace, so the cliff's full shape is visible even with only a handful of live writes. */
export function drawCliffPlot(
  ctx: CanvasRenderingContext2D,
  frame: Rect,
  opacity: number,
  dim: number,
  history: readonly CliffPoint[],
  band?: readonly SweepBandPoint[]
): void {
  if (opacity <= 0 || frame.w <= 0 || frame.h <= 0) return;

  const bandMaxN = band && band.length > 0 ? band[band.length - 1].n : 0;
  const maxN = Math.max(dim * 3, bandMaxN, (history[history.length - 1]?.n ?? 0) + 2);
  const xFor = (n: number) => frame.x + (n / maxN) * frame.w;
  const yFor = (r: number) => frame.y + frame.h * (1 - Math.max(0, r));

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.fillStyle = PANEL_FILL;
  ctx.fillRect(frame.x, frame.y, frame.w, frame.h);

  ctx.strokeStyle = GRID_LINE_SOFT;
  ctx.lineWidth = 1;
  for (const yv of [0, 0.25, 0.5, 0.75, 1.0]) {
    const y = yFor(yv);
    ctx.beginPath();
    ctx.moveTo(frame.x, y);
    ctx.lineTo(frame.x + frame.w, y);
    ctx.stroke();
  }

  const capX = xFor(dim);
  ctx.strokeStyle = rgba(TRUTH, 0.7);
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(capX, frame.y);
  ctx.lineTo(capX, frame.y + frame.h);
  ctx.stroke();
  ctx.setLineDash([]);

  if (band && band.length > 1) {
    ctx.beginPath();
    band.forEach((pt, i) => {
      const x = xFor(pt.n);
      const y = yFor(Math.min(1, pt.mean + pt.std));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    for (let i = band.length - 1; i >= 0; i--) {
      const pt = band[i];
      ctx.lineTo(xFor(pt.n), yFor(Math.max(0, pt.mean - pt.std)));
    }
    ctx.closePath();
    ctx.fillStyle = rgba(INK, 0.055);
    ctx.fill();

    ctx.strokeStyle = rgba(INK, 0.4);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    band.forEach((pt, i) => {
      const x = xFor(pt.n);
      const y = yFor(pt.mean);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (history.length > 0) {
    ctx.strokeStyle = rgba(MEMORY, 0.9);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    history.forEach((pt, idx) => {
      const x = xFor(pt.n);
      const y = yFor(pt.recall);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    for (const pt of history) {
      const color = pt.recall >= 0.85 ? rgba(TRUTH, 1) : pt.recall >= 0.65 ? rgba(DATA, 1) : rgba(INTERFERENCE, 1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(xFor(pt.n), yFor(pt.recall), 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ON_PANEL;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(frame.x + 0.5, frame.y + 0.5, frame.w - 1, frame.h - 1);
  ctx.restore();
}
