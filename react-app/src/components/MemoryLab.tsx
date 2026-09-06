import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  Matrix,
  Vector,
  readAssociation,
  cosineSimilarity,
  randomUnitVector,
  vectorDot,
  vectorFromText,
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
  onAddCustomPair?: (k: Vector, v: Vector, label: string) => void;
}

export const MemoryLab: React.FC<MemoryLabProps> = ({
  dim,
  setDim,
  pairs,
  matrix,
  onAddPair,
  onAddFive,
  onClear,
  onAddCustomPair,
}) => {
  // Mode selection: 'matrix' (Live State & Inspection) or 'step-read' (Step-by-step ciechanow.ski readout)
  const [activeTab, setActiveTab] = useState<'matrix' | 'sandbox' | 'step-read'>('matrix');

  // Hovered item for synchronized cross-highlighting
  const [hoveredPairIndex, setHoveredPairIndex] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number; val: number } | null>(null);

  // Custom Input Sandbox State
  const [customKeyText, setCustomKeyText] = useState('gravity');
  const [customValText, setCustomValText] = useState('orbit');

  // Step-by-Step Read Visualizer State
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);
  const [currentRowStep, setCurrentRowStep] = useState<number>(-1); // -1 = start/unstarted, 0..dim-1 = row in progress, dim = complete
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Compute recall similarities for all stored pairs
  const recalls = useMemo(() => {
    return pairs.map(p => {
      const retrieved = readAssociation(matrix, p.key);
      const similarity = cosineSimilarity(retrieved, p.value);
      return {
        label: p.label,
        similarity,
        retrieved,
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
    return m < 1e-6 ? 1 : m;
  }, [matrix, dim]);

  // Capacity calculations
  const capacityRatio = pairs.length / dim;
  const meanRecall = recalls.length > 0 ? recalls.reduce((s, r) => s + r.similarity, 0) / recalls.length : 1.0;

  // Custom Vector Generation & Overlap Check
  const customKeyVector = useMemo(() => vectorFromText(customKeyText || 'key', dim), [customKeyText, dim]);
  const customValVector = useMemo(() => vectorFromText(customValText || 'val', dim), [customValText, dim]);

  const maxKeyOverlap = useMemo(() => {
    if (pairs.length === 0) return 0;
    let maxDot = 0;
    for (const p of pairs) {
      const d = Math.abs(vectorDot(customKeyVector, p.key));
      if (d > maxDot) maxDot = d;
    }
    return maxDot;
  }, [pairs, customKeyVector]);

  // Handle Injecting Custom Pair
  const handleInjectCustom = () => {
    if (!onAddCustomPair) return;
    const label = `${customKeyText.trim()} → ${customValText.trim()}`;
    onAddCustomPair(customKeyVector, customValVector, label);
    setCustomKeyText('');
    setCustomValText('');
  };

  // Step-through readout timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isPlaying) {
      if (currentRowStep < dim) {
        timer = setTimeout(() => {
          setCurrentRowStep(prev => prev + 1);
        }, 320);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentRowStep, dim]);

  // Reset stepper when dim or selected pair changes
  useEffect(() => {
    setCurrentRowStep(-1);
    setIsPlaying(false);
  }, [selectedPairIndex, dim]);

  // Canvas Heatmap smooth rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetMatrixRef = useRef<Matrix>(matrix);
  const currentMatrixRef = useRef<Matrix>(matrix);

  useEffect(() => {
    targetMatrixRef.current = matrix;
  }, [matrix]);

  // Interpolation animation frame for matrix cell transitions
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const target = targetMatrixRef.current;
      let curr = currentMatrixRef.current;
      if (curr.length !== dim || curr[0]?.length !== dim) {
        curr = target;
        currentMatrixRef.current = target;
      }

      // Smooth lerp (15% per frame)
      let diffSum = 0;
      const lerped: Matrix = [];
      for (let r = 0; r < dim; r++) {
        lerped[r] = [];
        for (let c = 0; c < dim; c++) {
          const tVal = target[r]?.[c] ?? 0;
          const cVal = curr[r]?.[c] ?? 0;
          const nextVal = cVal + (tVal - cVal) * 0.2;
          lerped[r][c] = nextVal;
          diffSum += Math.abs(tVal - nextVal);
        }
      }
      currentMatrixRef.current = lerped;

      // Draw onto canvas
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const cellSize = width / dim;
      const padding = dim <= 8 ? 2 : dim <= 16 ? 1.5 : 1;

      for (let r = 0; r < dim; r++) {
        for (let c = 0; c < dim; c++) {
          const val = lerped[r][c];
          const norm = Math.max(-1, Math.min(1, val / maxAbs));

          // Color calculation:
          // Negative: Crimson #FF4D4D -> Slate #13161F -> Positive: Electric Cyan #00D2FF
          let rC = 19, gC = 22, bC = 31; // neutral base #13161F
          if (norm > 0) {
            rC = Math.round(19 + norm * (0 - 19));
            gC = Math.round(22 + norm * (210 - 22));
            bC = Math.round(31 + norm * (255 - 31));
          } else if (norm < 0) {
            const s = -norm;
            rC = Math.round(19 + s * (255 - 19));
            gC = Math.round(22 + s * (77 - 22));
            bC = Math.round(31 + s * (77 - 31));
          }

          ctx.fillStyle = `rgb(${rC}, ${gC}, ${bC})`;
          ctx.fillRect(
            c * cellSize + padding,
            r * cellSize + padding,
            cellSize - padding * 2,
            cellSize - padding * 2
          );

          // Highlight row if step visualizer is active on this row
          if (activeTab === 'step-read' && currentRowStep === r) {
            ctx.strokeStyle = '#00D2FF';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              c * cellSize + 1,
              r * cellSize + 1,
              cellSize - 2,
              cellSize - 2
            );
          }

          // Optional text numbers for smaller dimensions
          if (dim <= 8) {
            ctx.fillStyle = Math.abs(norm) > 0.5 ? '#000000' : 'rgba(255,255,255,0.7)';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val.toFixed(2), (c + 0.5) * cellSize, (r + 0.5) * cellSize);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [dim, maxAbs, activeTab, currentRowStep]);

  // Handle Canvas Mouse Move to show cell tooltip
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellSize = rect.width / dim;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (row >= 0 && row < dim && col >= 0 && col < dim) {
      const val = matrix[row]?.[col] ?? 0;
      setHoveredCell({ r: row, c: col, val });
    }
  };

  const currentPair = pairs[selectedPairIndex] || pairs[0];

  // Active step-through computations
  const stepTargetKey = currentPair?.key;
  const stepTargetVal = currentPair?.value;

  // Compute row-wise dot products for the active query
  const rowResults = useMemo(() => {
    if (!stepTargetKey) return [];
    return Array.from({ length: dim }).map((_, r) => {
      let sum = 0;
      const terms = [];
      for (let c = 0; c < dim; c++) {
        const mVal = matrix[r]?.[c] ?? 0;
        const qVal = stepTargetKey[c] ?? 0;
        const prod = mVal * qVal;
        sum += prod;
        terms.push({ mVal, qVal, prod });
      }
      return { row: r, sum, terms, expectedVal: stepTargetVal ? stepTargetVal[r] : 0 };
    });
  }, [matrix, stepTargetKey, stepTargetVal, dim]);

  // Signal vs Interference breakdown for the current queried pair
  const projectionBreakdown = useMemo(() => {
    if (!stepTargetKey || pairs.length === 0) return [];
    return pairs.map((p, idx) => {
      const proj = vectorDot(p.key, stepTargetKey);
      const isTarget = idx === selectedPairIndex;
      return {
        idx,
        label: p.label,
        proj,
        isTarget,
      };
    });
  }, [pairs, stepTargetKey, selectedPairIndex]);

  return (
    <section id="memory" className="py-20 border-t border-border/80 bg-canvas relative overflow-hidden">
      {/* Subtle ambient lighting glows */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-memory/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-40 w-96 h-96 bg-truth/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-xs text-memory font-semibold tracking-wider uppercase bg-memory/10 px-2.5 py-0.5 rounded border border-memory/20">
            02 // THE MECHANISM
          </span>
          <span className="text-xs text-ink-muted">&mdash; In-Browser Mathematical Substrate</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-display text-ink font-normal tracking-tight mb-4">
          Memory Lab: Outer-Product Associative Memory
        </h2>
        <p className="text-base sm:text-lg text-ink-muted max-w-3xl mb-8 leading-relaxed">
          Store key&rarr;value associations in a fixed-size $d \times d$ matrix using rank-1 Hebbian outer products.
          Then read them back out. Observe directly where and why interference begins.
        </p>

        {/* Global Toolbar & Mode Tabs */}
        <div className="bg-surface/80 border border-border rounded-xl p-3 sm:p-4 mb-8 backdrop-blur-xl shadow-glass-card flex flex-wrap items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-linen/80 rounded-lg border border-border">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-surface text-ink shadow-sm border border-border/80 font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-memory" />
              <span>Matrix State & Heatmap</span>
            </button>

            <button
              onClick={() => setActiveTab('step-read')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'step-read'
                  ? 'bg-surface text-ink shadow-sm border border-border/80 font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-truth" />
              <span>Step-by-Step Readout (v̂ = M q)</span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'sandbox'
                  ? 'bg-surface text-ink shadow-sm border border-border/80 font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-memory" />
              <span>Custom Input Sandbox</span>
            </button>
          </div>

          {/* Quick Controls: Dimension & Add */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-linen/60 px-3 py-1.5 rounded-lg border border-border/80">
              <span className="text-xs font-mono text-ink-muted">DIM:</span>
              <select
                value={dim}
                onChange={e => setDim(Number(e.target.value))}
                className="bg-transparent text-xs font-mono font-semibold text-ink focus:outline-none cursor-pointer"
              >
                <option value={4} className="bg-surface text-ink">d = 4</option>
                <option value={8} className="bg-surface text-ink">d = 8</option>
                <option value={16} className="bg-surface text-ink">d = 16</option>
                <option value={32} className="bg-surface text-ink">d = 32</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onAddPair}
                className="px-3 py-1.5 rounded-lg bg-memory/15 text-memory hover:bg-memory/25 border border-memory/30 text-xs font-mono font-medium transition-all flex items-center gap-1"
                title="Inject 1 random association"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1 Pair</span>
              </button>
              <button
                onClick={onAddFive}
                className="px-3 py-1.5 rounded-lg bg-linen text-ink hover:bg-linen/80 border border-border text-xs font-mono font-medium transition-all"
                title="Inject 5 random associations"
              >
                +5 Pairs
              </button>
              <button
                onClick={onClear}
                className="px-2.5 py-1.5 rounded-lg text-interference/80 hover:text-interference hover:bg-interference/10 border border-interference/20 text-xs font-mono transition-all"
                title="Clear matrix back to zeros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Live Matrix Heatmap & Stored Pairs Ledger */}
        {activeTab === 'matrix' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 animate-fadeIn">
            {/* Heatmap Column (7 cols) */}
            <div className="lg:col-span-7 bg-surface/90 border border-border rounded-xl p-5 sm:p-6 shadow-glass-card flex flex-col items-center relative retro-terminal-frame">
              <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-memory animate-pulse shadow-glow-cyan" />
                  <span className="text-xs font-mono uppercase font-semibold text-ink tracking-wider">
                    Matrix M ({dim}&times;{dim}) &mdash; Real-time Canvas
                  </span>
                </div>
                <div className="text-[11px] font-mono text-ink-muted flex items-center gap-2">
                  <span>Normalized Abs: &plusmn;{maxAbs.toFixed(2)}</span>
                </div>
              </div>

              {/* Dynamic Canvas Element */}
              <div className="relative flex flex-col items-center justify-center p-3 bg-canvas/60 rounded-xl border border-border/80 w-full max-w-[340px] aspect-square">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={320}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={() => setHoveredCell(null)}
                  className="rounded-lg shadow-inner cursor-crosshair max-w-full h-auto"
                />

                {/* Floating Tooltip */}
                {hoveredCell && (
                  <div className="absolute top-2 left-2 pointer-events-none bg-surface-elevated/95 border border-memory/40 px-2 py-1 rounded shadow-lg font-mono text-[11px] text-ink z-20">
                    M[{hoveredCell.r}, {hoveredCell.c}] = <span className="text-memory font-bold">{hoveredCell.val.toFixed(3)}</span>
                  </div>
                )}
              </div>

              {/* Diverging Colormap Legend */}
              <div className="w-full max-w-[340px] mt-4 flex items-center justify-between text-[11px] font-mono text-ink-muted">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-interference" />
                  <span>- {maxAbs.toFixed(1)}</span>
                </div>
                <span className="text-ink-faint">0.0 (Zero)</span>
                <div className="flex items-center gap-1.5">
                  <span>+ {maxAbs.toFixed(1)}</span>
                  <span className="w-3 h-3 rounded-sm bg-memory" />
                </div>
              </div>

              {/* Capacity Meter */}
              <div className="w-full max-w-md mt-6 pt-4 border-t border-border/60">
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-ink-muted">Capacity Load (n / d):</span>
                  <span className={`font-bold ${capacityRatio <= 0.75 ? 'text-truth' : capacityRatio <= 1.0 ? 'text-memory' : 'text-interference'}`}>
                    {pairs.length} / {dim} slots ({capacityRatio.toFixed(2)}&times;)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-linen rounded-full border border-border overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      capacityRatio <= 0.75
                        ? 'bg-truth'
                        : capacityRatio <= 1.0
                        ? 'bg-memory'
                        : 'bg-interference'
                    }`}
                    initial={false}
                    animate={{ width: `${Math.min(capacityRatio * 100, 100)}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <p className="text-[11px] text-ink-faint mt-1.5 m-0 leading-relaxed font-sans">
                  {capacityRatio <= 1.0
                    ? 'State is within dimensional capacity. Key cross-talk remains bounded.'
                    : 'Capacity exceeded! Keys are linearly dependent in this dimension, causing interference bleed.'}
                </p>
              </div>
            </div>

            {/* Truth vs Recall Ledger Column (5 cols) */}
            <div className="lg:col-span-5 bg-surface/90 border border-border rounded-xl p-5 sm:p-6 shadow-glass-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/70">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-truth animate-pulse" />
                    <span className="text-xs font-mono uppercase font-semibold text-ink tracking-wider">
                      Associative Retrieval Fidelity
                    </span>
                  </div>
                  <span className="text-xs font-mono text-truth font-semibold">
                    Mean: {recalls.length > 0 ? `${(meanRecall * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>

                {/* Stored Pairs List with Hover Highlighting */}
                <div className="overflow-y-auto max-h-[340px] space-y-2 pr-1">
                  {recalls.length === 0 ? (
                    <div className="py-12 text-center text-ink-muted text-xs font-sans">
                      <p className="mb-2">Memory is currently empty.</p>
                      <button
                        onClick={onAddPair}
                        className="text-memory underline font-mono hover:text-memory-dark"
                      >
                        + Add a random association
                      </button>
                    </div>
                  ) : (
                    recalls.map((r, i) => {
                      const pct = Math.round(r.similarity * 100);
                      const isHigh = r.similarity >= 0.85;
                      const isMid = r.similarity >= 0.65;
                      const statusColor = isHigh ? 'text-truth' : isMid ? 'text-memory' : 'text-interference';
                      const barColor = isHigh ? 'bg-truth' : isMid ? 'bg-memory' : 'bg-interference';

                      return (
                        <div
                          key={i}
                          onMouseEnter={() => setHoveredPairIndex(i)}
                          onMouseLeave={() => setHoveredPairIndex(null)}
                          className={`p-2.5 rounded-lg border transition-all text-xs font-mono flex items-center justify-between gap-3 ${
                            hoveredPairIndex === i
                              ? 'bg-surface-elevated border-memory shadow-sm'
                              : 'bg-linen/60 border-border/70 hover:border-border-hover'
                          }`}
                        >
                          <div className="truncate font-medium text-ink flex items-center gap-1.5">
                            <span className="text-[10px] text-ink-faint">#{i + 1}</span>
                            <span className="truncate">{r.label}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-16 h-1.5 bg-linen rounded-full border border-border/80 overflow-hidden">
                              <motion.div
                                className={`h-full ${barColor}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(0, Math.min(pct, 100))}%` }}
                                transition={{ duration: 0.2 }}
                              />
                            </div>
                            <span className={`w-9 text-right font-bold text-[11px] ${statusColor}`}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom Guidance */}
              <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-ink-muted">
                <span>Hover a pair to inspect</span>
                <button
                  onClick={() => {
                    setActiveTab('step-read');
                    setSelectedPairIndex(0);
                  }}
                  className="text-memory hover:underline text-xs font-mono flex items-center gap-1"
                >
                  <span>Step-through Readout</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Step-by-Step Readout Visualizer (ciechanow.ski style) */}
        {activeTab === 'step-read' && (
          <div className="bg-surface/90 border border-border rounded-xl p-6 sm:p-8 mb-8 shadow-glass-card animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-border/70">
              <div>
                <h3 className="text-xl font-display text-ink font-semibold m-0 mb-1 flex items-center gap-2">
                  <span>Tactile Vector-Matrix Readout:</span>
                  <code className="text-sm font-mono text-memory bg-memory/10 px-2 py-0.5 rounded border border-memory/30 font-normal">
                    &lang;v&#770;&rang; = M &middot; q
                  </code>
                </h3>
                <p className="text-xs text-ink-muted m-0">
                  Inspect the dot product across each row of $M$ to see target signal accumulate vs. non-orthogonal keys cross-talk.
                </p>
              </div>

              {/* Pair Selector */}
              {pairs.length > 0 && (
                <div className="flex items-center gap-2 bg-linen px-3 py-1.5 rounded-lg border border-border">
                  <span className="text-xs font-mono text-ink-muted">Query Pair:</span>
                  <select
                    value={selectedPairIndex}
                    onChange={e => setSelectedPairIndex(Number(e.target.value))}
                    className="bg-transparent text-xs font-mono font-semibold text-ink focus:outline-none cursor-pointer"
                  >
                    {pairs.map((p, idx) => (
                      <option key={p.id} value={idx} className="bg-surface text-ink">
                        #{idx + 1}: {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {pairs.length === 0 ? (
              <div className="py-12 text-center text-ink-muted text-sm">
                Please add at least one pair to explore the step-by-step vector-matrix read.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stepper Transport Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-linen border border-border/70">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(p => !p)}
                      className="px-3.5 py-1.5 rounded-md bg-memory text-white font-mono text-xs font-medium hover:bg-memory-dark flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
                    </button>

                    <button
                      onClick={() => setCurrentRowStep(s => Math.max(-1, s - 1))}
                      disabled={currentRowStep <= -1}
                      className="px-2.5 py-1.5 rounded-md bg-surface text-ink hover:bg-surface-elevated border border-border text-xs font-mono disabled:opacity-40 transition-colors"
                    >
                      &larr; Prev Row
                    </button>

                    <button
                      onClick={() => setCurrentRowStep(s => Math.min(dim, s + 1))}
                      disabled={currentRowStep >= dim}
                      className="px-2.5 py-1.5 rounded-md bg-surface text-ink hover:bg-surface-elevated border border-border text-xs font-mono disabled:opacity-40 transition-colors"
                    >
                      Next Row &rarr;
                    </button>

                    <button
                      onClick={() => {
                        setCurrentRowStep(-1);
                        setIsPlaying(false);
                      }}
                      className="p-1.5 rounded-md bg-surface text-ink-muted hover:text-ink border border-border transition-colors"
                      title="Reset step to beginning"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs font-mono text-ink-muted">
                    {currentRowStep < 0 ? (
                      <span>Ready to step &mdash; Press Next Row</span>
                    ) : currentRowStep < dim ? (
                      <span>
                        Computing Row <strong className="text-memory font-bold">{currentRowStep}</strong> of {dim - 1}
                      </span>
                    ) : (
                      <span className="text-truth font-bold">&#x2713; Readout Complete</span>
                    )}
                  </div>
                </div>

                {/* Step Matrix Row Multiplying Query Vector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Row Calculation Panel */}
                  <div className="md:col-span-2 bg-canvas/80 border border-border rounded-xl p-4 font-mono text-xs overflow-x-auto">
                    <div className="text-ink-muted uppercase font-semibold text-[11px] mb-3 flex items-center justify-between">
                      <span>Row-wise Dot Product Accumulation</span>
                      <span>r = {Math.max(0, Math.min(currentRowStep, dim - 1))}</span>
                    </div>

                    {currentRowStep < 0 ? (
                      <div className="py-8 text-center text-ink-faint font-sans text-xs">
                        Click "Next Row" or "Auto Play" to walk through row-by-row matrix multiplication.
                      </div>
                    ) : currentRowStep < dim ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-ink leading-relaxed">
                          <span className="text-memory font-bold">v&#770;[{currentRowStep}]</span> = &sum;
                          {rowResults[currentRowStep]?.terms.map((t, c) => (
                            <span
                              key={c}
                              className="px-1.5 py-0.5 rounded bg-surface border border-border text-[11px]"
                            >
                              ({t.mVal.toFixed(2)} &times; {t.qVal.toFixed(2)})
                            </span>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-sm">
                          <span className="text-ink-muted">Calculated Output:</span>
                          <span className="font-bold text-memory">
                            {rowResults[currentRowStep]?.sum.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-ink-faint">
                          <span>Ground Truth Target (v[{currentRowStep}]):</span>
                          <span>{rowResults[currentRowStep]?.expectedVal.toFixed(4)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center space-y-2 font-sans">
                        <CheckCircle2 className="w-8 h-8 text-truth mx-auto" />
                        <div className="text-sm font-semibold text-ink">All {dim} Rows Computed!</div>
                        <div className="text-xs text-ink-muted">
                          Cosine similarity to ground truth:{' '}
                          <strong className="text-truth font-mono">
                            {recalls[selectedPairIndex] ? `${(recalls[selectedPairIndex].similarity * 100).toFixed(1)}%` : '—'}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mathematical Decomposition: Signal vs Bleed */}
                  <div className="bg-linen/70 border border-border rounded-xl p-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="text-xs font-mono font-semibold uppercase text-ink-muted mb-2">
                        Decomposition Analysis
                      </div>
                      <p className="text-[11px] text-ink-muted leading-relaxed mb-3">
                        Total readout is the sum of target projection plus all non-orthogonal cross-terms:
                      </p>

                      <div className="space-y-1.5 font-mono text-[11px]">
                        {projectionBreakdown.map((item, i) => (
                          <div
                            key={i}
                            className={`p-1.5 rounded flex items-center justify-between border ${
                              item.isTarget
                                ? 'bg-truth/10 border-truth/30 text-truth font-bold'
                                : Math.abs(item.proj) > 0.3
                                ? 'bg-interference/10 border-interference/30 text-interference'
                                : 'bg-surface border-border/70 text-ink-muted'
                            }`}
                          >
                            <span className="truncate max-w-[110px]">{item.label}</span>
                            <span>{item.isTarget ? 'Target: ' : 'Bleed: '}{item.proj.toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-border/60 text-[10px] text-ink-faint italic font-sans">
                      Notice: Any non-zero bleed terms corrupt the target vector direction.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Custom Input Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="bg-surface/90 border border-border rounded-xl p-6 sm:p-8 mb-8 shadow-glass-card animate-fadeIn">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-xl font-display text-ink font-semibold mb-1">
                  Custom Associative Write Sandbox
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Type custom semantic concepts to generate deterministic unit vectors $k$ and $v$, verify their orthogonality with existing memory, and inject them into State $M$.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-ink-muted uppercase">
                    Key Concept (Query Trigger)
                  </label>
                  <input
                    type="text"
                    value={customKeyText}
                    onChange={e => setCustomKeyText(e.target.value)}
                    placeholder="e.g. proton, neuron, winter"
                    className="w-full bg-canvas border border-border rounded-lg p-2.5 text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-memory"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-ink-muted uppercase">
                    Value Concept (Retrieved Memory)
                  </label>
                  <input
                    type="text"
                    value={customValText}
                    onChange={e => setCustomValText(e.target.value)}
                    placeholder="e.g. positive, synapse, snow"
                    className="w-full bg-canvas border border-border rounded-lg p-2.5 text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-memory"
                  />
                </div>
              </div>

              {/* Orthogonality Pre-Check Gauge */}
              <div className="p-4 rounded-lg bg-canvas border border-border font-mono text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Max Overlap with Stored Keys:</span>
                  <span className={`font-bold ${maxKeyOverlap < 0.25 ? 'text-truth' : maxKeyOverlap < 0.5 ? 'text-memory' : 'text-interference'}`}>
                    |k &middot; k_i| &le; {maxKeyOverlap.toFixed(3)}
                  </span>
                </div>
                <div className="text-[11px] text-ink-faint font-sans">
                  {maxKeyOverlap < 0.25
                    ? '🟢 High orthogonality detected. Storing this pair will introduce negligible cross-talk.'
                    : maxKeyOverlap < 0.5
                    ? '🟡 Moderate overlap. Recall will be slightly degraded by linear interference.'
                    : '🔴 High directional overlap! This key is close to an existing vector and will cause mutual interference.'}
                </div>
              </div>

              {/* Inject Button */}
              <button
                onClick={handleInjectCustom}
                disabled={!customKeyText.trim() || !customValText.trim()}
                className="w-full py-2.5 rounded-lg bg-memory text-white font-medium text-xs font-mono hover:bg-memory-dark disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Write "{customKeyText || 'key'} &rarr; {customValText || 'val'}" into Memory Matrix</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Academic Footnote */}
        <p className="text-xs text-ink-muted border-t border-border/70 pt-4 flex items-center justify-between flex-wrap gap-2">
          <span>
            <strong>Mathematical Substrate:</strong> All writes (M &larr; M + v k<sup>T</sup>) and reads (v&#770; = M q) execute live via pure linear algebra in <code>lib/memory-math.ts</code>.
          </span>
          <a
            href="https://arxiv.org/abs/2509.26507"
            target="_blank"
            rel="noopener noreferrer"
            className="text-memory hover:underline"
          >
            BDH Paper (arXiv:2509.26507, Eq. 5–7) &rarr;
          </a>
        </p>
      </div>
    </section>
  );
};
