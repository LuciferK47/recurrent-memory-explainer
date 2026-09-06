import React from 'react';

export const ProblemComparison: React.FC = () => {
  // Calibrated chart dimensions
  const width = 440;
  const height = 220;
  const padding = { left: 60, right: 30, top: 25, bottom: 45 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const yTicks = [
    { val: 0, label: '0 MB' },
    { val: 64, label: '64 MB' },
    { val: 128, label: '128 MB' },
    { val: 192, label: '192 MB' },
    { val: 256, label: '256 MB' },
  ];

  const xTicks = [
    { val: 0, label: '0' },
    { val: 2048, label: '2k' },
    { val: 4096, label: '4k' },
    { val: 6144, label: '6k' },
    { val: 8192, label: '8k' },
  ];

  // KV-Cache Line: (0, 0 MB) -> (8192, 256 MB)
  const kvX2 = padding.left + plotW;
  const kvY2 = padding.top;
  const kvX1 = padding.left;
  const kvY1 = padding.top + plotH;

  // Fixed State Line: Constant 8 MB
  const fixedY = padding.top + plotH * (1 - 8.0 / 256);

  return (
    <section id="problem" className="py-16 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-sm font-display text-ink-muted mb-2">01 The Problem</div>
        <h2 className="text-3xl sm:text-4xl font-display text-ink mb-3">
          Transformers Remember Everything. That's Expensive.
        </h2>
        <p className="text-base text-ink-muted max-w-2xl mb-8 leading-relaxed">
          Standard Transformers store every past token in a key–value cache that grows linearly with context length. More context = more memory = more cost.
        </p>

        {/* Charts Grid — Renders immediately on mount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* KV-Cache Chart */}
          <div className="bg-surface/90 border border-border/80 rounded-xl overflow-hidden shadow-md flex flex-col backdrop-blur-sm">
            <div className="bg-surface-elevated/80 border-b border-border/80 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink uppercase tracking-wide">KV-Cache Growth</span>
              <span className="text-xs font-mono text-interference bg-interference/10 px-2 py-0.5 rounded border border-interference/30">
                O(n) Scaling
              </span>
            </div>
            <div className="p-4 flex justify-center">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-[440px]">
                {/* Background */}
                <rect x={padding.left} y={padding.top} width={plotW} height={plotH} fill="#0E121B" rx={4} />

                {/* Y Grid & Labels */}
                {yTicks.map(t => {
                  const y = padding.top + plotH * (1 - t.val / 256);
                  return (
                    <g key={t.val}>
                      <line x1={padding.left} y1={y} x2={padding.left + plotW} y2={y} stroke="#1A2130" strokeWidth={1} />
                      <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-ink-muted text-[10px] font-mono">
                        {t.label}
                      </text>
                    </g>
                  );
                })}

                {/* X Grid & Labels */}
                {xTicks.map(t => {
                  const x = padding.left + (t.val / 8192) * plotW;
                  return (
                    <g key={t.val}>
                      <line x1={x} y1={padding.top} x2={x} y2={padding.top + plotH} stroke="#1A2130" strokeWidth={1} />
                      <text x={x} y={height - padding.bottom + 16} textAnchor="middle" className="fill-ink-muted text-[10px] font-mono">
                        {t.label}
                      </text>
                    </g>
                  );
                })}

                {/* Plot Frame */}
                <rect x={padding.left} y={padding.top} width={plotW} height={plotH} fill="none" stroke="#262B3D" strokeWidth={1} rx={4} />

                {/* Shaded Area */}
                <polygon
                  points={`${kvX1},${kvY1} ${kvX2},${kvY2} ${kvX2},${kvY1}`}
                  fill="#FF4D4D"
                  fillOpacity={0.12}
                />

                {/* Linear Growth Line */}
                <line x1={kvX1} y1={kvY1} x2={kvX2} y2={kvY2} stroke="#FF4D4D" strokeWidth={2.5} />
                <circle cx={kvX2} cy={kvY2} r={4} fill="#FF4D4D" />

                {/* Label readout */}
                <text x={kvX2 - 12} y={kvY2 + 18} textAnchor="end" className="fill-ink font-mono text-[11px] font-semibold">
                  O(n): 256.0 MB @ 8k tok
                </text>

                {/* Axis Titles */}
                <text x={padding.left + plotW / 2} y={height - 8} textAnchor="middle" className="fill-ink-muted text-[11px] font-mono">
                  Sequence Length (tokens)
                </text>
                <text
                  x={-padding.top - plotH / 2}
                  y={16}
                  transform="rotate(-90)"
                  textAnchor="middle"
                  className="fill-ink-muted text-[11px] font-mono"
                >
                  Memory Footprint (MB)
                </text>
              </svg>
            </div>
            <p className="px-4 py-3 text-xs text-ink-muted border-t border-border/70 bg-surface-elevated/40 m-0">
              Each new token adds a new key and value vector. At sequence length <em>n</em>, memory usage is <strong>O(n)</strong>. For long conversations, this becomes the dominant cost.
            </p>
          </div>

          {/* Fixed-State Chart */}
          <div className="bg-surface/90 border border-border/80 rounded-xl overflow-hidden shadow-md flex flex-col backdrop-blur-sm">
            <div className="bg-surface-elevated/80 border-b border-border/80 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink uppercase tracking-wide">The Alternative: Fixed-Size State</span>
              <span className="text-xs font-mono text-memory bg-memory/10 px-2 py-0.5 rounded border border-memory/30">
                O(1) Memory
              </span>
            </div>
            <div className="p-4 flex justify-center">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-[440px]">
                {/* Background */}
                <rect x={padding.left} y={padding.top} width={plotW} height={plotH} fill="#0E121B" rx={4} />

                {/* Y Grid & Labels */}
                {yTicks.map(t => {
                  const y = padding.top + plotH * (1 - t.val / 256);
                  return (
                    <g key={t.val}>
                      <line x1={padding.left} y1={y} x2={padding.left + plotW} y2={y} stroke="#1A2130" strokeWidth={1} />
                      <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-ink-muted text-[10px] font-mono">
                        {t.label}
                      </text>
                    </g>
                  );
                })}

                {/* X Grid & Labels */}
                {xTicks.map(t => {
                  const x = padding.left + (t.val / 8192) * plotW;
                  return (
                    <g key={t.val}>
                      <line x1={x} y1={padding.top} x2={x} y2={padding.top + plotH} stroke="#1A2130" strokeWidth={1} />
                      <text x={x} y={height - padding.bottom + 16} textAnchor="middle" className="fill-ink-muted text-[10px] font-mono">
                        {t.label}
                      </text>
                    </g>
                  );
                })}

                {/* Plot Frame */}
                <rect x={padding.left} y={padding.top} width={plotW} height={plotH} fill="none" stroke="#262B3D" strokeWidth={1} rx={4} />

                {/* Shaded Area for Constant Memory */}
                <rect
                  x={padding.left}
                  y={fixedY}
                  width={plotW}
                  height={padding.top + plotH - fixedY}
                  fill="#00D2FF"
                  fillOpacity={0.12}
                />

                {/* Constant Line */}
                <line x1={padding.left} y1={fixedY} x2={padding.left + plotW} y2={fixedY} stroke="#00D2FF" strokeWidth={2.5} />
                <circle cx={padding.left + plotW} cy={fixedY} r={4} fill="#00D2FF" />

                {/* Label readout */}
                <text x={padding.left + 15} y={fixedY - 8} className="fill-ink font-mono text-[11px] font-semibold">
                  O(1): 8.0 MB (constant state)
                </text>

                {/* Axis Titles */}
                <text x={padding.left + plotW / 2} y={height - 8} textAnchor="middle" className="fill-ink-muted text-[11px] font-mono">
                  Sequence Length (tokens)
                </text>
                <text
                  x={-padding.top - plotH / 2}
                  y={16}
                  transform="rotate(-90)"
                  textAnchor="middle"
                  className="fill-ink-muted text-[11px] font-mono"
                >
                  Memory Footprint (MB)
                </text>
              </svg>
            </div>
            <p className="px-4 py-3 text-xs text-ink-muted border-t border-border/70 bg-surface-elevated/40 m-0">
              What if instead of growing the cache, we compress everything into a <strong>fixed-size matrix</strong>? Memory stays constant — <strong>O(1)</strong> — regardless of sequence length. But there's a cost…
            </p>
          </div>
        </div>

        {/* The Fundamental Tradeoff Table */}
        <div className="mt-8">
          <h3 className="text-xl font-display text-ink mb-3">The Fundamental Tradeoff</h3>
          <div className="overflow-x-auto bg-surface/90 border border-border/80 rounded-xl shadow-md backdrop-blur-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-elevated/80 border-b border-border/80">
                  <th className="py-3 px-4 text-xs font-semibold text-ink">Property</th>
                  <th className="py-3 px-4 text-xs font-semibold text-ink">KV-Cache (Transformer)</th>
                  <th className="py-3 px-4 text-xs font-semibold text-ink">Fixed-Size Recurrent State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-ink">Memory per step</td>
                  <td className="py-3 px-4 text-ink">Grows: O(n)</td>
                  <td className="py-3 px-4 text-memory font-semibold">Constant: O(1)</td>
                </tr>
                <tr className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-ink">Recall fidelity</td>
                  <td className="py-3 px-4 text-truth font-semibold">Perfect — everything stored</td>
                  <td className="py-3 px-4 text-ink">Degrades under load</td>
                </tr>
                <tr className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-ink">Inference cost</td>
                  <td className="py-3 px-4 text-ink">Grows with context</td>
                  <td className="py-3 px-4 text-memory font-semibold">Constant</td>
                </tr>
                <tr className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-ink">Failure mode</td>
                  <td className="py-3 px-4 text-ink">OOM / quadratic slowdown</td>
                  <td className="py-3 px-4 text-interference font-medium">Interference — memories corrupt each other</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-muted italic border-t border-border/70 pt-3 mt-4">
            This is the core tradeoff this explainer teaches. BDH ({' '}
            <a
              href="https://arxiv.org/abs/2509.26507"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline not-italic"
            >
              arXiv:2509.26507
            </a>
            ) and BDH-CQ ({' '}
            <a
              href="https://arxiv.org/abs/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline not-italic"
            >
              arXiv:2608.09888
            </a>
            ) implement the fixed-size approach — Section 3 explains how.
          </p>
        </div>
      </div>
    </section>
  );
};
