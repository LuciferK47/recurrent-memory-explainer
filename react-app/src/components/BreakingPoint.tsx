import React, { useState, useEffect } from 'react';
import { Reveal } from './ui/Reveal';
import { Panel } from './ui/Panel';
import { Badge } from './ui/Badge';

interface SweepPoint {
  n_associations: number;
  capacity_ratio: number;
  mean: number;
  std: number;
}

interface SweepDimData {
  dim: number;
  max_associations: number;
  data: SweepPoint[];
}

interface SweepData {
  sweep: Record<string, SweepDimData>;
}

/**
 * The live "push past capacity" flood experiment now lives in the Stage's
 * `cliff` scene, built from the shared memory store (see Stage.tsx's
 * cliffHistoryRef and stage/render/draw-plot.ts) — every write made
 * anywhere on this page shows up there, rather than a separate flood
 * experiment with its own disconnected memory. What stays here is the
 * precomputed multi-dimensional sweep, which is a distinct evidence
 * category (see EvidencePanel) from the live substrate.
 */
export const BreakingPoint: React.FC = () => {
  const [sweepData, setSweepData] = useState<SweepData | null>(null);
  const baseUrl = import.meta.env.BASE_URL || './';

  useEffect(() => {
    fetch(`${baseUrl}data/interference_sweep.json`)
      .then(r => r.json())
      .then((data: SweepData) => setSweepData(data))
      .catch(err => console.warn('Could not fetch sweep data:', err));
  }, [baseUrl]);

  return (
    <Reveal>
    <Panel tone="data" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-xl font-display text-ink m-0">Interference Sweep Across Dimensions</h3>
        <Badge tone="precomputed">precomputed</Badge>
      </div>

      <p className="text-sm text-ink-muted mb-6 leading-relaxed">
        Below: mean cosine similarity vs. number of stored associations, for memory dimensions d = 4, 8, 16, 32, 64. The vertical dashed line marks n = d (the "capacity" point). Notice the consistent pattern: recall is near-perfect below capacity and degrades predictably above it.
      </p>

      {/* Precomputed Sweep SVG */}
      {sweepData && sweepData.sweep ? (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 540 260" className="w-full h-auto max-w-[560px]">
            <rect x={55} y={25} width={455} height={185} fill="#0E2029" rx={4} />

            {/* Y Grid */}
            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(yVal => {
              const y = 25 + 185 * (1 - yVal);
              return (
                <g key={yVal}>
                  <line x1={55} y1={y} x2={510} y2={y} stroke="rgba(234,242,245,0.12)" strokeWidth={1} />
                  <text x={47} y={y + 4} textAnchor="end" className="fill-ink-muted font-mono text-[11px]">
                    {yVal.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* X Ticks (0x to 4x) */}
            {[0, 1, 2, 3, 4].map(xVal => {
              const x = 55 + (xVal / 4.0) * 455;
              return (
                <g key={xVal}>
                  <line x1={x} y1={25} x2={x} y2={210} stroke="rgba(234,242,245,0.12)" strokeWidth={1} />
                  <text x={x} y={226} textAnchor="middle" className="fill-ink-muted font-mono text-[11px]">
                    {xVal}x
                  </text>
                </g>
              );
            })}

            {/* n = d boundary line at 1.0x */}
            <line x1={55 + (1.0 / 4.0) * 455} y1={25} x2={55 + (1.0 / 4.0) * 455} y2={210} stroke="rgba(234,242,245,0.5)" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={55 + (1.0 / 4.0) * 455} y={16} textAnchor="middle" className="fill-ink-muted font-mono text-[11px] font-semibold">
              n = d (Rank Limit)
            </text>

            <rect x={55} y={25} width={455} height={185} fill="none" stroke="rgba(234,242,245,0.2)" strokeWidth={1} rx={4} />

            {/* Curves — same five hexes as the dimColors legend below and
                stage/render/theme.ts's accent hues; keep both in sync by hand. */}
            {Object.entries(sweepData.sweep).map(([d, dData]) => {
              const dimColors: Record<string, string> = {
                '4': '#FF6B6B',
                '8': '#FBBF24',
                '16': '#34D399',
                '32': '#00D2FF',
                '64': '#A78BFA',
              };
              const color = dimColors[d] || '#00D2FF';
              const pts = dData.data
                .filter(pt => pt.capacity_ratio <= 4.0)
                .map(pt => {
                  const x = 55 + (pt.capacity_ratio / 4.0) * 455;
                  const y = 25 + 185 * (1 - pt.mean);
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ');

              return (
                <g key={d}>
                  <polyline points={pts} fill="none" stroke={color} strokeWidth={2.2} />
                </g>
              );
            })}

            <text x={55 + 455 / 2} y={252} textAnchor="middle" className="fill-ink-muted font-mono text-[11px]">
              Capacity Ratio (n / d) — Stored Pairs Normalized by Dimension
            </text>
            <text x={-25 - 185 / 2} y={16} transform="rotate(-90)" textAnchor="middle" className="fill-ink-muted font-mono text-[11px]">
              Mean Cosine Similarity
            </text>
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            {[
              { d: '4', c: '#FF6B6B' },
              { d: '8', c: '#FBBF24' },
              { d: '16', c: '#34D399' },
              { d: '32', c: '#00D2FF' },
              { d: '64', c: '#A78BFA' },
            ].map(item => (
              <span
                key={item.d}
                className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 bg-surface-elevated border border-border/80 rounded-lg text-ink"
              >
                <span className="w-2.5 h-1 rounded" style={{ backgroundColor: item.c }} />
                d={item.d}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-ink-muted font-mono">Loading precomputed sweep data...</div>
      )}

      {/* Exact Reproducibility Line */}
      <p className="text-xs text-ink-muted italic border-t border-border/70 pt-3 mt-6 mb-0">
        Generated by scripts/precompute_interference.py — 20 trials per data point, random unit vectors.{' '}
        <a
          href={`${baseUrl}data/interference_sweep.json`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-memory underline not-italic font-medium"
        >
          View raw data
        </a>
        .
      </p>
    </Panel>
    </Reveal>
  );
};
