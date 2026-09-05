import React, { useState, useEffect, useMemo } from 'react';
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

export const BreakingPoint: React.FC = () => {
  // Live Overload Experiment State
  const [overloadDim, setOverloadDim] = useState<number>(8);
  const [overloadMatrix, setOverloadMatrix] = useState<Matrix>(() => createZeroMatrix(8));
  const [overloadPairs, setOverloadPairs] = useState<Array<{ key: Vector; value: Vector }>>([]);
  const [history, setHistory] = useState<Array<{ n: number; recall: number }>>([]);

  // Precomputed Sweep Data State
  const [sweepData, setSweepData] = useState<SweepData | null>(null);

  const baseUrl = import.meta.env.BASE_URL || './';

  useEffect(() => {
    fetch(`${baseUrl}data/interference_sweep.json`)
      .then(r => r.json())
      .then((data: SweepData) => setSweepData(data))
      .catch(err => console.warn('Could not fetch sweep data:', err));
  }, [baseUrl]);

  // Handle Dimension Change
  const handleDimChange = (newDim: number) => {
    setOverloadDim(newDim);
    setOverloadMatrix(createZeroMatrix(newDim));
    setOverloadPairs([]);
    setHistory([]);
  };

  // Add 1 Overload Pair
  const addPair = () => {
    const k = randomUnitVector(overloadDim);
    const v = randomUnitVector(overloadDim);
    const updatedM = writeAssociation(overloadMatrix, k, v);
    const updatedPairs = [...overloadPairs, { key: k, value: v }];

    // Compute recall across all stored pairs
    let sum = 0;
    for (const p of updatedPairs) {
      const retrieved = readAssociation(updatedM, p.key);
      sum += cosineSimilarity(retrieved, p.value);
    }
    const recall = sum / updatedPairs.length;

    setOverloadMatrix(updatedM);
    setOverloadPairs(updatedPairs);
    setHistory(prev => [...prev, { n: updatedPairs.length, recall }]);
  };

  // Flood (+20)
  const floodPairs = () => {
    let currentM = overloadMatrix;
    const currentPairs = [...overloadPairs];
    const newHistory = [...history];

    for (let i = 0; i < 20; i++) {
      const k = randomUnitVector(overloadDim);
      const v = randomUnitVector(overloadDim);
      currentM = writeAssociation(currentM, k, v);
      currentPairs.push({ key: k, value: v });

      let sum = 0;
      for (const p of currentPairs) {
        const retrieved = readAssociation(currentM, p.key);
        sum += cosineSimilarity(retrieved, p.value);
      }
      newHistory.push({ n: currentPairs.length, recall: sum / currentPairs.length });
    }

    setOverloadMatrix(currentM);
    setOverloadPairs(currentPairs);
    setHistory(newHistory);
  };

  // Reset Overload
  const resetOverload = () => {
    setOverloadMatrix(createZeroMatrix(overloadDim));
    setOverloadPairs([]);
    setHistory([]);
  };

  const currentRecall = history.length > 0 ? history[history.length - 1].recall : null;

  // Overload SVG chart dimensions
  const chartW = 500;
  const chartH = 220;
  const pad = { left: 55, right: 25, top: 25, bottom: 40 };
  const pW = chartW - pad.left - pad.right;
  const pH = chartH - pad.top - pad.bottom;

  const maxN = Math.max(overloadDim * 3, (history[history.length - 1]?.n ?? 0) + 2);
  const capX = pad.left + (overloadDim / maxN) * pW;

  const historyPointsString = useMemo(() => {
    if (history.length === 0) return '';
    return history
      .map(pt => {
        const x = pad.left + (pt.n / maxN) * pW;
        const y = pad.top + pH * (1 - Math.max(0, pt.recall));
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history, maxN, pW, pH]);

  return (
    <section id="interference" className="py-16 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-sm font-display text-ink-muted mb-2">04 The Breaking Point</div>
        <h2 className="text-3xl sm:text-4xl font-display text-ink mb-3">
          When Memory Overflows: The Interference Cliff
        </h2>
        <p className="text-base text-ink-muted max-w-2xl mb-8 leading-relaxed">
          Our claim says recall degrades "when the number of associations exceeds the memory's rank." Here's the proof — try to break it yourself.
        </p>

        {/* Live Experiment Instrument Panel with Retro-Terminal Frame */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm mb-8 retro-terminal-frame">
          <div className="bg-linen border-b border-border px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-truth animate-pulse" />
              <span className="text-xs font-semibold text-ink uppercase tracking-wide">
                Live Experiment — Push Past Capacity
              </span>
            </div>
            <span className="text-[11px] font-mono text-memory bg-surface px-2 py-0.5 rounded border border-border">
              CH_02 // LIVE_OVERLOAD_SWEEP
            </span>
          </div>

          <div className="p-4 sm:p-6">
            <p className="text-xs text-ink-muted mb-4">
              Click rapidly to flood the memory. Watch the mean recall drop as stored pairs exceed the dimension.
            </p>

            {/* Controls Bar */}
            <div className="bg-linen/60 border border-border rounded-lg p-3 mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2">
                  <label htmlFor="overload-dim" className="text-xs font-semibold text-ink-muted uppercase">
                    Dimension
                  </label>
                  <select
                    id="overload-dim"
                    value={overloadDim}
                    onChange={e => handleDimChange(Number(e.target.value))}
                    className="bg-surface border border-border rounded px-2.5 py-1 text-xs font-medium text-ink cursor-pointer"
                  >
                    <option value={4}>d = 4</option>
                    <option value={8}>d = 8</option>
                    <option value={16}>d = 16</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink-muted uppercase">Stored</span>
                  <span className="font-mono text-xs font-semibold text-ink">{overloadPairs.length}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink-muted uppercase">Mean Recall</span>
                  <span
                    className={`font-mono text-xs font-semibold ${
                      currentRecall === null || currentRecall >= 0.85
                        ? 'text-truth'
                        : currentRecall >= 0.65
                        ? 'text-ink'
                        : 'text-interference'
                    }`}
                  >
                    {currentRecall !== null ? `${(currentRecall * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={addPair}
                  className="border border-memory text-memory hover:bg-memory/10 px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  + Add Pair
                </button>
                <button
                  onClick={floodPairs}
                  className="border border-border text-ink hover:bg-linen px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Flood (+20)
                </button>
                <button
                  onClick={resetOverload}
                  className="border border-interference text-interference hover:bg-interference/10 px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Overload Chart with Motion Line Draw-On (Motion Item 3) */}
            <div className="flex justify-center">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto max-w-[560px]">
                <rect x={pad.left} y={pad.top} width={pW} height={pH} fill="#ffffff" />

                {/* Y Grid (0.0 to 1.0) */}
                {[0, 0.25, 0.5, 0.75, 1.0].map(yVal => {
                  const y = pad.top + pH * (1 - yVal);
                  return (
                    <g key={yVal}>
                      <line x1={pad.left} y1={y} x2={pad.left + pW} y2={y} stroke="#dee2de" strokeWidth={1} />
                      <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-ink-muted font-mono text-[10px]">
                        {yVal.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Capacity dashed line at n = dim */}
                <line x1={capX} y1={pad.top} x2={capX} y2={pad.top + pH} stroke="#282834" strokeWidth={1.5} strokeDasharray="4 3" />
                <text x={capX} y={pad.top - 8} textAnchor="middle" className="fill-ink font-sans text-[10px] font-semibold">
                  Capacity (n = d = {overloadDim})
                </text>

                {/* Plot border */}
                <rect x={pad.left} y={pad.top} width={pW} height={pH} fill="none" stroke="#dee2de" strokeWidth={1} />

                {/* Motion Line Draw-On */}
                {history.length > 0 && (
                  <motion.polyline
                    points={historyPointsString}
                    fill="none"
                    stroke="#1d6fa5"
                    strokeWidth={2.2}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* History dots */}
                {history.map((pt, i) => {
                  const x = pad.left + (pt.n / maxN) * pW;
                  const y = pad.top + pH * (1 - Math.max(0, pt.recall));
                  const dotColor = pt.recall >= 0.85 ? '#1b7a4e' : pt.recall >= 0.65 ? '#171717' : '#c04928';
                  return <circle key={i} cx={x} cy={y} r={3} fill={dotColor} stroke="#ffffff" strokeWidth={1} />;
                })}

                {history.length === 0 && (
                  <text x={pad.left + pW / 2} y={pad.top + pH / 2} textAnchor="middle" className="fill-ink-muted font-sans text-xs">
                    Click "+ Add Pair" or "Flood (+20)" to sample live recall degradation
                  </text>
                )}

                <text x={pad.left + pW / 2} y={chartH - 8} textAnchor="middle" className="fill-ink font-sans text-[11px]">
                  Number of Stored Associations (n)
                </text>
                <text x={-pad.top - pH / 2} y={16} transform="rotate(-90)" textAnchor="middle" className="fill-ink font-sans text-[11px]">
                  Mean Recall
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Precomputed Sweep Across Dimensions Card */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-xl font-display text-ink m-0">Interference Sweep Across Dimensions</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded border border-border bg-linen text-ink">
              precomputed
            </span>
          </div>

          <p className="text-sm text-ink mb-6 leading-relaxed">
            Below: mean cosine similarity vs. number of stored associations, for memory dimensions d = 4, 8, 16, 32, 64. The vertical dashed line marks n = d (the "capacity" point). Notice the consistent pattern: recall is near-perfect below capacity and degrades predictably above it.
          </p>

          {/* Precomputed Sweep SVG */}
          {sweepData && sweepData.sweep ? (
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 540 260" className="w-full h-auto max-w-[560px]">
                <rect x={55} y={25} width={455} height={185} fill="#ffffff" />

                {/* Y Grid */}
                {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(yVal => {
                  const y = 25 + 185 * (1 - yVal);
                  return (
                    <g key={yVal}>
                      <line x1={55} y1={y} x2={510} y2={y} stroke="#dee2de" strokeWidth={1} />
                      <text x={47} y={y + 4} textAnchor="end" className="fill-ink-muted font-mono text-[10px]">
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
                      <line x1={x} y1={25} x2={x} y2={210} stroke="#dee2de" strokeWidth={1} />
                      <text x={x} y={226} textAnchor="middle" className="fill-ink-muted font-mono text-[10px]">
                        {xVal}x
                      </text>
                    </g>
                  );
                })}

                {/* n = d boundary line at 1.0x */}
                <line x1={55 + (1.0 / 4.0) * 455} y1={25} x2={55 + (1.0 / 4.0) * 455} y2={210} stroke="#282834" strokeWidth={1.5} strokeDasharray="4 3" />
                <text x={55 + (1.0 / 4.0) * 455} y={16} textAnchor="middle" className="fill-ink font-sans text-[10px] font-semibold">
                  n = d (Rank Limit)
                </text>

                <rect x={55} y={25} width={455} height={185} fill="none" stroke="#dee2de" strokeWidth={1} />

                {/* Curves */}
                {Object.entries(sweepData.sweep).map(([d, dData]) => {
                  const dimColors: Record<string, string> = {
                    '4': '#c04928',
                    '8': '#171717',
                    '16': '#1b7a4e',
                    '32': '#1d6fa5',
                    '64': '#646464',
                  };
                  const color = dimColors[d] || '#171717';
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
                      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} />
                    </g>
                  );
                })}

                <text x={55 + 455 / 2} y={252} textAnchor="middle" className="fill-ink font-sans text-[11px]">
                  Capacity Ratio (n / d) — Stored Pairs Normalized by Dimension
                </text>
                <text x={-25 - 185 / 2} y={16} transform="rotate(-90)" textAnchor="middle" className="fill-ink font-sans text-[11px]">
                  Mean Cosine Similarity
                </text>
              </svg>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                {[
                  { d: '4', c: '#c04928' },
                  { d: '8', c: '#171717' },
                  { d: '16', c: '#1b7a4e' },
                  { d: '32', c: '#1d6fa5' },
                  { d: '64', c: '#646464' },
                ].map(item => (
                  <span
                    key={item.d}
                    className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 bg-linen border border-border rounded"
                  >
                    <span className="w-2.5 h-1 rounded" style={{ backgroundColor: item.c }} />
                    d={item.d}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-ink-muted">Loading precomputed sweep data...</div>
          )}

          {/* Exact Reproducibility Line */}
          <p className="text-xs text-ink-muted italic border-t border-border pt-3 mt-6 mb-0">
            Generated by scripts/precompute_interference.py — 20 trials per data point, random unit vectors.{' '}
            <a
              href={`${baseUrl}data/interference_sweep.json`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline not-italic font-medium"
            >
              View raw data
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
};
