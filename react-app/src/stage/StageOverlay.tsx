import React from 'react';
import { STAGE_W, STAGE_H } from '../lib/canvas';
import { MATRIX_TARGET, GRAPH_TARGET, PLOT_TARGET } from '../lib/layout';
import { SceneId } from '../state/scene-spec';
import { EDGE_THRESHOLD } from './render/draw-graph';
import { GUTTER } from './render/draw-beams';

interface StageOverlayProps {
  sceneId: SceneId;
  dim: number;
  pairCount: number;
  meanRecall: number;
  maxAbs: number;
  /** The panel's live CSS width in px, from a ResizeObserver in Stage.tsx (re-renders only on actual resize, not per animation frame) — 0 before first measurement. */
  panelWidth: number;
}

/** A sensible desktop default so labels render at a reasonable size for the
 * one frame before the ResizeObserver's first callback lands. */
const FALLBACK_SCALE = 0.584;

/**
 * Crisp SVG text over the canvas — labels, axis ticks, legends, the capacity
 * readout. Same `0 0 STAGE_W STAGE_H` viewBox as the canvas's stage-unit
 * transform, so a label's (x, y) lands exactly on the canvas feature it
 * annotates, at native text quality.
 *
 * Font sizes here are stage units, and stage units shrink with the panel:
 * the Stage's right column is typically ~584 CSS px against a 1000-unit
 * viewBox, a 0.584 scale, so a naive `fontSize: 9` used to paint at ~5.3
 * effective px — nothing in this file exceeded 7.6px on a 1280px desktop,
 * and it dropped to ~3.2px on a 390px phone. `stagePx()` below inverts that:
 * every call site names the CSS px size text should actually render at, and
 * this converts it to the stage-unit size that produces it at the panel's
 * current live width.
 *
 * Also: no `fontWeight: 600` — Departure Mono ships only a 400 face (see
 * index.css's @font-face), so a requested 600 was always browser-synthesized
 * faux-bold, which smears rather than thickens at these sizes. Emphasis
 * comes from color and size instead.
 *
 * Each scene explains itself without needing the prose column: the write
 * scene gets a colorbar and axis labels, synapse gets column headers and a
 * real legend (reading the same EDGE_THRESHOLD draw-graph.ts actually uses,
 * not a second hardcoded copy), and cliff gets real axis ticks plus a
 * legend distinguishing the precomputed band from the live trace.
 *
 * Deliberately simple for this phase: text shows/hides on the discrete,
 * hysteresis-committed `sceneId` (already React state, changes a few times
 * per scroll) rather than continuously fading with scroll position.
 */
export const StageOverlay: React.FC<StageOverlayProps> = ({ sceneId, dim, pairCount, meanRecall, maxAbs, panelWidth }) => {
  const scale = panelWidth > 0 ? panelWidth / STAGE_W : FALLBACK_SCALE;
  const stagePx = (effectivePx: number) => effectivePx / scale;

  const capacityRatio = pairCount / dim;
  const capacityColor = capacityRatio <= 0.75 ? '#34D399' : capacityRatio <= 1.0 ? '#00D2FF' : '#FF6B6B';
  const maxAbsLabel = maxAbs > 1e-6 ? maxAbs.toFixed(2) : '0.00';

  const titleStyle: React.CSSProperties = { fontSize: stagePx(14), letterSpacing: stagePx(0.3) };
  const labelStyle: React.CSSProperties = { fontSize: stagePx(12) };
  const captionStyle: React.CSSProperties = { fontSize: stagePx(12.5) };
  const tickStyle: React.CSSProperties = { fontSize: stagePx(11) };
  const readoutStyle: React.CSSProperties = { fontSize: stagePx(13.5), letterSpacing: stagePx(0.2) };

  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="stage-colorbar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="50%" stopColor="#1C2E38" />
          <stop offset="100%" stopColor="#FF6B6B" />
        </linearGradient>
      </defs>

      {sceneId === 'kv-cache' && (
        <>
          <text x={60} y={268} className="fill-interference font-mono" style={titleStyle}>
            O(n) — grows with every token
          </text>
          <text x={MATRIX_TARGET.x} y={MATRIX_TARGET.y - 16} className="fill-memory font-mono" style={titleStyle}>
            O(1) — fixed, regardless of length
          </text>
        </>
      )}

      {sceneId === 'write' && (
        <>
          <text x={MATRIX_TARGET.x} y={MATRIX_TARGET.y - 18} className="fill-ink font-mono" style={titleStyle}>
            MATRIX M ({dim}&times;{dim})
          </text>
          <text
            x={MATRIX_TARGET.x - GUTTER / 2 - 2}
            y={MATRIX_TARGET.y + MATRIX_TARGET.h / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${MATRIX_TARGET.x - GUTTER / 2 - 2}, ${MATRIX_TARGET.y + MATRIX_TARGET.h / 2})`}
            className="fill-ink-muted font-mono"
            style={labelStyle}
          >
            v (rows)
          </text>
          <text
            x={MATRIX_TARGET.x + MATRIX_TARGET.w / 2}
            y={MATRIX_TARGET.y - 18}
            textAnchor="middle"
            className="fill-ink-muted font-mono"
            style={labelStyle}
          >
            k (cols) &rarr;
          </text>

          {/* Colorbar: same 3-stop gradient lib/colormap.ts interpolates
              (interference red -> panel neutral -> memory blue), so a
              reader can translate a cell's color into an actual sign and
              rough magnitude without hovering every cell. */}
          <rect
            x={MATRIX_TARGET.x + MATRIX_TARGET.w + 22}
            y={MATRIX_TARGET.y}
            width={14}
            height={MATRIX_TARGET.h}
            fill="url(#stage-colorbar)"
            stroke="rgba(234,242,245,0.25)"
            strokeWidth={1}
          />
          <text x={MATRIX_TARGET.x + MATRIX_TARGET.w + 40} y={MATRIX_TARGET.y + 5} className="fill-ink-muted font-mono" style={labelStyle}>
            +{maxAbsLabel}
          </text>
          <text
            x={MATRIX_TARGET.x + MATRIX_TARGET.w + 40}
            y={MATRIX_TARGET.y + MATRIX_TARGET.h / 2 + 5}
            className="fill-ink-muted font-mono"
            style={labelStyle}
          >
            0
          </text>
          <text
            x={MATRIX_TARGET.x + MATRIX_TARGET.w + 40}
            y={MATRIX_TARGET.y + MATRIX_TARGET.h + 3}
            className="fill-ink-muted font-mono"
            style={labelStyle}
          >
            &minus;{maxAbsLabel}
          </text>

          <text
            x={MATRIX_TARGET.x + MATRIX_TARGET.w}
            y={MATRIX_TARGET.y + MATRIX_TARGET.h + 24}
            textAnchor="end"
            className="font-mono"
            style={{ ...readoutStyle, fill: capacityColor }}
          >
            {pairCount} / {dim} slots ({capacityRatio.toFixed(2)}&times;)
          </text>
        </>
      )}

      {sceneId === 'synapse' && (
        <>
          <text x={GRAPH_TARGET.x} y={GRAPH_TARGET.y - 18} className="fill-ink font-mono" style={titleStyle}>
            SYNAPTIC GRAPH — key &rarr; value
          </text>
          <text x={GRAPH_TARGET.x + 14} y={GRAPH_TARGET.y - 3} className="fill-memory font-mono" style={labelStyle}>
            KEYS (k)
          </text>
          <text
            x={GRAPH_TARGET.x + GRAPH_TARGET.w - 14}
            y={GRAPH_TARGET.y - 3}
            textAnchor="end"
            className="fill-truth font-mono"
            style={labelStyle}
          >
            VALUES (v)
          </text>

          <text x={GRAPH_TARGET.x} y={GRAPH_TARGET.y + GRAPH_TARGET.h + 22} className="fill-ink-muted font-mono" style={captionStyle}>
            edges shown where |M[i,j]| exceeds {Math.round(EDGE_THRESHOLD * 100)}% of the strongest connection
          </text>
          <text x={GRAPH_TARGET.x} y={GRAPH_TARGET.y + GRAPH_TARGET.h + 40} className="font-mono" style={captionStyle}>
            <tspan className="fill-memory">&#9679; blue = positive</tspan>
            <tspan className="fill-ink-muted" dx={stagePx(14)}>
              &middot;
            </tspan>
            <tspan className="fill-interference" dx={stagePx(14)}>
              &#9679; red = negative
            </tspan>
            <tspan className="fill-ink-muted" dx={stagePx(14)}>
              &middot; node size = connection strength
            </tspan>
          </text>
        </>
      )}

      {sceneId === 'cliff' && (
        <>
          {[0, 0.25, 0.5, 0.75, 1.0].map(yv => (
            <text
              key={yv}
              x={PLOT_TARGET.x - 10}
              y={PLOT_TARGET.y + PLOT_TARGET.h * (1 - yv) + 4}
              textAnchor="end"
              className="fill-ink-muted font-mono"
              style={tickStyle}
            >
              {yv.toFixed(2)}
            </text>
          ))}
          {[0, 1, 2, 3].map(mult => {
            const n = mult * dim;
            const x = PLOT_TARGET.x + (n / (dim * 3)) * PLOT_TARGET.w;
            return (
              <text
                key={mult}
                x={x}
                y={PLOT_TARGET.y + PLOT_TARGET.h + 18}
                textAnchor="middle"
                className="fill-ink-muted font-mono"
                style={tickStyle}
              >
                {mult === 1 ? `d=${n}` : n}
              </text>
            );
          })}
          <text
            x={PLOT_TARGET.x + PLOT_TARGET.w / 2}
            y={PLOT_TARGET.y + PLOT_TARGET.h + 34}
            textAnchor="middle"
            className="fill-ink-muted font-mono"
            style={captionStyle}
          >
            Number of Stored Associations (n)
          </text>
          <text
            x={-(PLOT_TARGET.y + PLOT_TARGET.h / 2)}
            y={PLOT_TARGET.x - 24}
            textAnchor="middle"
            transform="rotate(-90)"
            className="fill-ink-muted font-mono"
            style={captionStyle}
          >
            Mean Recall
          </text>

          {/* Legend: precomputed band vs. this session's own writes — kept
              visually and textually distinct per the evidence-classification
              discipline (CLAUDE.md §4.3): a Monte Carlo simulation must never
              be presented as if it were the live substrate. */}
          <g transform={`translate(${PLOT_TARGET.x + 14}, ${PLOT_TARGET.y + 16})`}>
            <line x1={0} y1={0} x2={stagePx(18)} y2={0} stroke="rgba(234,242,245,0.5)" strokeWidth={1.4} strokeDasharray="5 3" />
            <text x={stagePx(24)} y={4} className="fill-ink-muted font-mono" style={tickStyle}>
              precomputed sweep (mean &plusmn; std, 20 trials)
            </text>
            <line x1={0} y1={stagePx(18)} x2={stagePx(18)} y2={stagePx(18)} stroke="#00D2FF" strokeWidth={2.2} />
            <text x={stagePx(24)} y={stagePx(18) + 4} className="fill-ink-muted font-mono" style={tickStyle}>
              your writes, this page
            </text>
          </g>

          <text
            x={PLOT_TARGET.x + PLOT_TARGET.w}
            y={PLOT_TARGET.y - 14}
            textAnchor="end"
            className="font-mono"
            style={{ ...readoutStyle, fill: capacityColor }}
          >
            n = {pairCount}, mean recall = {pairCount > 0 ? `${(meanRecall * 100).toFixed(1)}%` : '—'}
          </text>
        </>
      )}
    </svg>
  );
};
