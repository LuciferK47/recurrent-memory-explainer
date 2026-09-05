import React from 'react';
import { motion } from 'motion/react';

interface HeroProps {
  storedCount: number;
  dim: number;
}

export const Hero: React.FC<HeroProps> = ({ storedCount, dim }) => {
  // 4 keys and 4 values for the signature Hebbian network
  const keyNodes = [
    { id: 1, label: 'k_1', y: 40 },
    { id: 2, label: 'k_2', y: 100 },
    { id: 3, label: 'k_3', y: 160 },
    { id: 4, label: 'k_4', y: 220 },
  ];

  const valueNodes = [
    { id: 1, label: 'v_1', y: 40 },
    { id: 2, label: 'v_2', y: 100 },
    { id: 3, label: 'v_3', y: 160 },
    { id: 4, label: 'v_4', y: 220 },
  ];

  return (
    <section id="hero" className="relative pt-20 pb-16 md:pt-24 md:pb-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Narrative, Claim, and Action */}
          <div className="lg:col-span-7 text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-display font-normal text-ink mb-6 leading-[1.12]">
              How Fixed-Size Memory
              <br />
              Learns — and Forgets
            </h1>

            <div className="bg-surface border border-border border-l-4 border-l-memory rounded-lg p-5 sm:p-6 shadow-sm mb-6">
              <p className="text-ink text-base sm:text-lg leading-relaxed m-0">
                <span className="font-semibold text-ink">Claim:</span> A fixed-size recurrent memory can absorb key–value associations from demonstrations and recall them accurately —{' '}
                <span className="text-interference font-medium">
                  until the number of associations exceeds the memory's rank, at which point recall degrades through interference
                </span>{' '}
                in a predictable, measurable way.
              </p>
            </div>

            <p className="text-sm text-ink-muted mb-6">
              For CS/ML students who know what attention is. Prerequisites: basic linear algebra.
            </p>

            {/* Active Instrument Register summary */}
            <div className="inline-flex items-center gap-2 bg-linen border border-border rounded-full px-4 py-1.5 mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-truth animate-pulse" />
              <span className="text-xs text-ink font-mono">
                Active Instrument Register: <strong className="text-memory font-semibold">{storedCount} pairs</strong> pre-loaded in d = {dim} memory matrix
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <motion.a
                href="#problem"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 border border-memory text-memory hover:bg-memory/10 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Start Walkthrough <span>&rarr;</span>
              </motion.a>
              <motion.a
                href="#memory"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 border border-border text-ink hover:bg-linen px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Jump to Live Lab
              </motion.a>
            </div>
          </div>

          {/* Right Column: Signature Centerpiece Animated Hebbian Synaptic Network */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-surface/90 border border-border rounded-xl shadow-md p-4 sm:p-6 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-memory animate-pulse" />
                  <span className="text-[11px] font-mono font-semibold text-ink uppercase tracking-wider">
                    Synaptic Junction // M &larr; &Sigma; v&middot;k<sup>T</sup>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-ink-muted bg-linen px-2 py-0.5 rounded border border-border">
                  d = 4 Sub-Graph
                </span>
              </div>

              {/* Large Signature Network SVG with Glowing Nodes & Pulsing Synapses */}
              <div className="relative flex justify-center items-center">
                <svg
                  viewBox="0 0 360 260"
                  className="w-full h-auto max-w-[380px] overflow-visible"
                  style={{ filter: 'contrast(1.05)' }}
                >
                  <defs>
                    {/* Soft Phosphor Glow Filters for Memory (Blue) and Interference (Amber/Red) */}
                    <filter id="glow-memory" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-interference" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="synapse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1d6fa5" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#dee2de" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#c04928" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Synaptic Transmission Interconnect Lines (Animated with Motion) */}
                  {keyNodes.map(k =>
                    valueNodes.map(v => {
                      const isDiagonal = k.id === v.id;
                      const junctionX = 180;
                      const junctionY = 40 + (k.id - 1) * 60;

                      return (
                        <g key={`synapse-${k.id}-${v.id}`}>
                          {/* Key to Junction line */}
                          <motion.line
                            x1="55"
                            y1={k.y}
                            x2={junctionX}
                            y2={junctionY}
                            stroke={isDiagonal ? '#1d6fa5' : '#dee2de'}
                            strokeWidth={isDiagonal ? 1.75 : 0.8}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                              pathLength: 1,
                              opacity: isDiagonal
                                ? [0.4, 0.9, 0.4]
                                : [0.15, 0.45, 0.15],
                            }}
                            transition={{
                              pathLength: { duration: 0.8, delay: (k.id + v.id) * 0.08 },
                              opacity: {
                                repeat: Infinity,
                                duration: 4.5,
                                ease: 'easeInOut',
                                delay: (k.id + v.id) * 0.15,
                              },
                            }}
                          />

                          {/* Junction to Value line */}
                          <motion.line
                            x1={junctionX}
                            y1={junctionY}
                            x2="305"
                            y2={v.y}
                            stroke={isDiagonal ? '#c04928' : '#dee2de'}
                            strokeWidth={isDiagonal ? 1.75 : 0.8}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                              pathLength: 1,
                              opacity: isDiagonal
                                ? [0.4, 0.9, 0.4]
                                : [0.15, 0.45, 0.15],
                            }}
                            transition={{
                              pathLength: { duration: 0.8, delay: 0.4 + (k.id + v.id) * 0.08 },
                              opacity: {
                                repeat: Infinity,
                                duration: 4.5,
                                ease: 'easeInOut',
                                delay: (k.id + v.id) * 0.15,
                              },
                            }}
                          />
                        </g>
                      );
                    })
                  )}

                  {/* Center Synaptic Weight Matrix Enclosure */}
                  <rect
                    x="138"
                    y="18"
                    width="84"
                    height="224"
                    rx="6"
                    fill="#fefffc"
                    stroke="#dee2de"
                    strokeWidth="1"
                    className="shadow-sm"
                  />
                  <text
                    x="180"
                    y="32"
                    textAnchor="middle"
                    className="fill-ink-muted text-[8px] font-mono tracking-wider"
                  >
                    MATRIX M
                  </text>

                  {/* 4x4 Synaptic Weight Junction Nodes */}
                  {keyNodes.map(k =>
                    valueNodes.map((v, colIdx) => {
                      const jx = 153 + colIdx * 18;
                      const jy = 50 + (k.id - 1) * 50;
                      const isReinforced = k.id === v.id;

                      return (
                        <g key={`matrix-cell-${k.id}-${v.id}`}>
                          <motion.circle
                            cx={jx}
                            cy={jy}
                            r={isReinforced ? 5.5 : 3.5}
                            fill={isReinforced ? '#1d6fa5' : '#f9faf7'}
                            stroke={isReinforced ? '#1d6fa5' : '#dee2de'}
                            strokeWidth={1}
                            filter={isReinforced ? 'url(#glow-memory)' : undefined}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 + (k.id + colIdx) * 0.07 }}
                          />
                          {isReinforced && (
                            <motion.circle
                              cx={jx}
                              cy={jy}
                              r={8.5}
                              fill="none"
                              stroke="#1d6fa5"
                              strokeWidth={0.8}
                              initial={{ opacity: 0.8, scale: 0.8 }}
                              animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.3, 0.9] }}
                              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                            />
                          )}
                        </g>
                      );
                    })
                  )}

                  {/* Left Column: Key Glowing Circular Nodes (Memory Blue) */}
                  {keyNodes.map(k => (
                    <g key={`key-node-${k.id}`}>
                      {/* Outer pulse aura */}
                      <circle cx="45" cy={k.y} r="14" fill="#1d6fa5" fillOpacity="0.08" />
                      {/* Glowing Node Circle */}
                      <circle
                        cx="45"
                        cy={k.y}
                        r="10"
                        fill="#ffffff"
                        stroke="#1d6fa5"
                        strokeWidth="2"
                        filter="url(#glow-memory)"
                      />
                      <circle cx="45" cy={k.y} r="4" fill="#1d6fa5" />
                      <text
                        x="24"
                        y={k.y + 4}
                        textAnchor="end"
                        className="fill-ink text-[11px] font-mono font-medium"
                      >
                        {k.label}
                      </text>
                    </g>
                  ))}

                  {/* Right Column: Value Glowing Circular Nodes (Interference Amber/Red) */}
                  {valueNodes.map(v => (
                    <g key={`val-node-${v.id}`}>
                      {/* Outer pulse aura */}
                      <circle cx="315" cy={v.y} r="14" fill="#c04928" fillOpacity="0.08" />
                      {/* Glowing Node Circle */}
                      <circle
                        cx="315"
                        cy={v.y}
                        r="10"
                        fill="#ffffff"
                        stroke="#c04928"
                        strokeWidth="2"
                        filter="url(#glow-interference)"
                      />
                      <circle cx="315" cy={v.y} r="4" fill="#c04928" />
                      <text
                        x="335"
                        y={v.y + 4}
                        textAnchor="start"
                        className="fill-ink text-[11px] font-mono font-medium"
                      >
                        {v.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-ink-muted">
                <span>KEYS (k &isin; R<sup>d</sup>)</span>
                <span className="text-memory font-semibold">M &larr; M + v&middot;k<sup>T</sup></span>
                <span>VALUES (v &isin; R<sup>d</sup>)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
