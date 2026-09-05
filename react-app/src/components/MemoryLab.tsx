import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Matrix,
  Vector,
  createZeroMatrix,
  writeAssociation,
  readAssociation,
  cosineSimilarity,
  randomUnitVector,
} from '../lib/memory-math';

export interface StoredPair {
  id: string;
  key: Vector;
  value: Vector;
  label: string;
}

interface MemoryLabProps {
  dim: number;
  setDim: (d: number) => void;
  pairs: StoredPair[];
  matrix: Matrix;
  onAddPair: () => void;
  onAddFive: () => void;
  onClear: () => void;
}

// Map matrix value to diverging color on light canvas
// Negative: Cobalt (#1d6fa5) | Neutral: Light linen (#f0f2ee) | Positive: Terracotta (#c04928)
function getCellColor(value: number, maxAbs: number): string {
  const t = Math.max(-1, Math.min(1, value / (maxAbs || 1)));
  if (t >= 0) {
    const r = Math.round(240 - t * (240 - 192));
    const g = Math.round(242 - t * (242 - 73));
    const b = Math.round(238 - t * (238 - 40));
    return `rgb(${r},${g},${b})`;
  } else {
    const s = -t;
    const r = Math.round(240 - s * (240 - 29));
    const g = Math.round(242 - s * (242 - 111));
    const b = Math.round(238 - s * (238 - 165));
    return `rgb(${r},${g},${b})`;
  }
}

export const MemoryLab: React.FC<MemoryLabProps> = ({
  dim,
  setDim,
  pairs,
  matrix,
  onAddPair,
  onAddFive,
  onClear,
}) => {
  // Compute recall similarities for all stored pairs
  const recalls = useMemo(() => {
    return pairs.map(p => {
      const retrieved = readAssociation(matrix, p.key);
      const similarity = cosineSimilarity(retrieved, p.value);
      return {
        label: p.label,
        similarity,
      };
    });
  }, [pairs, matrix]);

  // Compute max absolute value in matrix for color normalization
  const maxAbs = useMemo(() => {
    let m = 0;
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        m = Math.max(m, Math.abs(matrix[i]?.[j] ?? 0));
      }
    }
    return m < 1e-10 ? 1 : m;
  }, [matrix, dim]);

  const capacityRatio = pairs.length / dim;
  const meanRecall = recalls.length > 0 ? recalls.reduce((s, r) => s + r.similarity, 0) / recalls.length : 1.0;

  return (
    <section id="memory" className="py-16 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-sm font-display text-ink-muted mb-2">02 The Mechanism</div>
        <h2 className="text-3xl sm:text-4xl font-display text-ink mb-3">
          Memory Lab: Outer-Product Associative Memory
        </h2>
        <p className="text-base text-ink-muted max-w-2xl mb-6 leading-relaxed">
          Store key&rarr;value pairs in a d&times;d matrix using a Hebbian write rule. Then query it. Watch what happens as you add more.
        </p>

        {/* Equation Frame */}
        <div className="bg-surface border border-border rounded-lg py-3 px-5 mb-8 text-center shadow-sm">
          <span className="font-mono text-ink text-sm sm:text-base">
            Write: M &larr; M + v &middot; k<sup>T</sup> &nbsp;&nbsp;|&nbsp;&nbsp; Read: v&#770; = M &middot; q
          </span>
        </div>

        {/* Controls Bar */}
        <div className="bg-surface border border-border rounded-lg p-4 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <label htmlFor="dim-select" className="text-xs font-semibold text-ink-muted uppercase">
                Dimension
              </label>
              <select
                id="dim-select"
                value={dim}
                onChange={e => setDim(Number(e.target.value))}
                className="bg-linen border border-border rounded px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-memory cursor-pointer"
              >
                <option value={4}>d = 4</option>
                <option value={8}>d = 8</option>
                <option value={16}>d = 16</option>
                <option value={32}>d = 32</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-muted uppercase">Stored Slots</span>
              <span className="font-mono text-sm font-semibold text-ink">
                {pairs.length} / {dim}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onAddPair}
              className="border border-memory text-memory hover:bg-memory/10 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              + Add Random Pair
            </button>
            <button
              onClick={onAddFive}
              className="border border-border text-ink hover:bg-linen px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              + Add 5
            </button>
            <button
              onClick={onClear}
              className="border border-interference text-interference hover:bg-interference/10 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Live Instrument Chassis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Heatmap Panel with Retro-Terminal Frame */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm flex flex-col retro-terminal-frame">
            <div className="bg-linen border-b border-border px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-truth animate-pulse" />
                <span className="text-xs font-semibold text-ink uppercase tracking-wide">Memory Matrix M (live)</span>
              </div>
              <span className="text-[11px] font-mono text-ink-muted bg-surface px-2 py-0.5 rounded border border-border">
                CH_01 // {dim}&times;{dim} HEBBIAN
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[300px]">
              {/* Departure Mono pixel-grid coordinate indicators */}
              <div className="text-[10px] font-mono text-ink-muted mb-1 flex justify-between w-full max-w-[280px] px-1">
                <span>c:0</span>
                <span>STATE REGISTER</span>
                <span>c:{dim - 1}</span>
              </div>

              {/* Heatmap Grid with Motion Cell Transition (Motion Item 1) */}
              <div
                className="grid gap-[2px] bg-border p-1 rounded-sm border border-border max-w-[280px] w-full aspect-square"
                style={{
                  gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${dim}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: dim }).map((_, r) =>
                  Array.from({ length: dim }).map((_, c) => {
                    const val = matrix[r]?.[c] ?? 0;
                    const cellBg = getCellColor(val, maxAbs);
                    return (
                      <motion.div
                        key={`${r}-${c}`}
                        initial={false}
                        animate={{ backgroundColor: cellBg }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="w-full h-full rounded-[1px]"
                        title={`M[${r},${c}] = ${val.toFixed(3)}`}
                      />
                    );
                  })
                )}
              </div>

              {/* Capacity Gauge */}
              <div className="w-full max-w-xs mt-4 flex flex-col items-center">
                <div className="text-xs text-ink-muted mb-1">Capacity Ratio (n / d)</div>
                <div className="font-mono text-xl font-semibold mb-2 text-memory">
                  {capacityRatio.toFixed(2)}
                </div>
                <div className="w-full h-2 bg-linen rounded-full border border-border overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      capacityRatio <= 0.75
                        ? 'bg-memory'
                        : capacityRatio <= 1.0
                        ? 'bg-truth'
                        : 'bg-interference'
                    }`}
                    initial={false}
                    animate={{ width: `${Math.min(capacityRatio * 100, 100)}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Truth vs Recall Table Panel */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm flex flex-col">
            <div className="bg-linen border-b border-border px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-truth animate-pulse" />
                <span className="text-xs font-semibold text-ink uppercase tracking-wide">Truth vs. Recall (live)</span>
              </div>
              <span className="text-xs font-mono text-ink-muted bg-surface px-2 py-0.5 rounded border border-border">
                Cosine Sim
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div className="overflow-y-auto max-h-[280px]">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-border text-ink-muted uppercase">
                      <th className="py-2 px-2">Pair</th>
                      <th className="py-2 px-2">Similarity</th>
                      <th className="py-2 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recalls.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-ink-muted font-sans text-xs">
                          Click "+ Add Random Pair" to begin
                        </td>
                      </tr>
                    ) : (
                      recalls.map((r, i) => {
                        const pct = Math.round(r.similarity * 100);
                        const isHigh = r.similarity >= 0.85;
                        const isMid = r.similarity >= 0.65;
                        const statusColor = isHigh ? 'text-truth' : isMid ? 'text-ink' : 'text-interference';
                        const barColor = isHigh ? 'bg-truth' : isMid ? 'bg-memory' : 'bg-interference';
                        const statusLabel = isHigh ? 'Accurate' : isMid ? 'Degraded' : 'Corrupted';

                        return (
                          <tr key={i} className="hover:bg-linen/40">
                            <td className="py-2 px-2 font-medium text-ink">{r.label}</td>
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-linen rounded-full border border-border overflow-hidden">
                                  {/* Recall Similarity Bar Transition (Motion Item 2) */}
                                  <motion.div
                                    className={`h-full ${barColor}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(0, Math.min(pct, 100))}%` }}
                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                  />
                                </div>
                                <span className={`text-[11px] font-semibold ${statusColor}`}>{pct}%</span>
                              </div>
                            </td>
                            <td className={`py-2 px-2 text-right text-[11px] font-medium ${statusColor}`}>
                              {statusLabel}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-ink-muted">Mean recall fidelity:</span>
                <span className={`font-mono font-bold text-sm ${meanRecall >= 0.85 ? 'text-truth' : meanRecall >= 0.65 ? 'text-ink' : 'text-interference'}`}>
                  {recalls.length > 0 ? `${(meanRecall * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-ink-muted italic border-t border-border pt-3">
          <strong>Real substrate:</strong> Every write and read runs live in your browser via <code>lib/memory-math.js</code>. This is a toy model implementing the same outer-product mechanism described in the BDH paper ({' '}
          <a
            href="https://arxiv.org/abs/2509.26507"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:text-memory underline not-italic"
          >
            arXiv:2509.26507
          </a>
          , Eq. 5–7). It is not the actual BDH system.
        </p>
      </div>
    </section>
  );
};
