import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Plus, CheckCircle2, ChevronRight } from 'lucide-react';
import {
  readAssociation,
  writeAssociation,
  cosineSimilarity,
  randomUnitVector,
  vectorDot,
  vectorFromText,
  makeKeyAtAngle,
  createRng,
} from '../lib/memory-math';
import { fromFlat } from '../lib/memory-math-flat';
import { useMemoryStore, useMemorySelector } from '../state/memory-store';
import { PRESET_LABELS } from '../lib/preset-labels';
import { EquationTerm } from './ui/EquationTerm';
import { Panel } from './ui/Panel';

/**
 * Stable per-reference-pair seed for the θ-slider's perpendicular direction.
 * `makeKeyAtAngle` draws a random raw vector before orthogonalizing it — if
 * we reseeded on every render the "which perpendicular direction" choice
 * would jitter as θ changes, even though θ alone should be the only thing
 * moving. Re-creating `createRng(seed)` fresh for every θ value replays the
 * exact same draw (same seed -> same first Box-Muller samples), so only the
 * cosθ/sinθ blend changes as the slider moves — one real variable, not two.
 */
function seedFromId(id: string, salt: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + salt;
}

/**
 * Illustrative 2D rendering of the angle θ between a reference key and the
 * key constructed at that angle. The two vectors genuinely live in `dim`
 * dimensions — this gauge does not project them, it just draws the angle
 * itself, which is exact by the Gram-Schmidt construction in
 * `makeKeyAtAngle` (see the caption under it in the sandbox).
 */
const AngleGauge: React.FC<{ thetaDeg: number }> = ({ thetaDeg }) => {
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const cx = 54;
  const cy = 118;
  const R = 96;
  const kx = cx + R;
  const ky = cy;
  const qx = cx + R * Math.cos(thetaRad);
  const qy = cy - R * Math.sin(thetaRad);
  const arcR = 32;
  const arcEndX = cx + arcR * Math.cos(thetaRad);
  const arcEndY = cy - arcR * Math.sin(thetaRad);
  const midAngle = thetaRad / 2;
  const labelX = cx + (arcR + 18) * Math.cos(midAngle);
  const labelY = cy - (arcR + 18) * Math.sin(midAngle);

  return (
    <svg viewBox="0 0 240 136" className="w-full h-auto">
      <defs>
        <marker id="angle-arrow-truth" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" className="fill-truth" />
        </marker>
        <marker id="angle-arrow-memory" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" className="fill-memory" />
        </marker>
      </defs>

      <line x1={cx} y1={cy} x2={cx + R + 8} y2={cy} strokeWidth={1} className="stroke-border" />
      <line x1={cx} y1={cy} x2={cx} y2={cy - R - 8} strokeWidth={1} strokeDasharray="2 3" className="stroke-border" />

      <path
        d={`M ${cx + arcR} ${cy} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`}
        fill="none"
        strokeWidth={1.5}
        className="stroke-interference"
      />
      <text x={labelX} y={labelY} textAnchor="middle" className="fill-interference font-mono" style={{ fontSize: 11, fontWeight: 600 }}>
        {thetaDeg}&deg;
      </text>

      <line x1={cx} y1={cy} x2={kx} y2={ky} strokeWidth={2.5} className="stroke-truth" markerEnd="url(#angle-arrow-truth)" />
      <text x={kx - 30} y={ky - 10} className="fill-truth font-mono" style={{ fontSize: 11, fontWeight: 600 }}>
        k_ref
      </text>

      <line x1={cx} y1={cy} x2={qx} y2={qy} strokeWidth={2.5} className="stroke-memory" markerEnd="url(#angle-arrow-memory)" />
      <text x={qx + 6} y={qy - 4} className="fill-memory font-mono" style={{ fontSize: 11, fontWeight: 600 }}>
        k(&theta;)
      </text>
    </svg>
  );
};

/**
 * The live matrix heatmap itself is now the Stage's `write` scene (see
 * stage/Stage.tsx, which renders this component inside its narrative
 * column) — both read the same shared memory store, so a write here is the
 * write animated on the right. What stays here: the controls, the
 * retrieval-fidelity ledger, the step-by-step readout, and the custom
 * sandbox — none of which duplicate the heatmap.
 */
export const MemoryLab: React.FC = () => {
  const store = useMemoryStore();
  const dim = useMemorySelector(s => s.dim);
  const pairs = useMemorySelector(s => s.pairs);
  const matrixFlat = useMemorySelector(s => s.matrix);
  // The live substrate (readAssociation, step-read below) is documented and
  // tested against the number[][] shape — convert once per write rather
  // than rewriting that logic for a Float32Array (see lib/memory-math-flat.ts).
  const matrix = useMemo(() => fromFlat(matrixFlat, dim), [matrixFlat, dim]);

  const addRandomPair = () => {
    const k = randomUnitVector(dim);
    const v = randomUnitVector(dim);
    const label = PRESET_LABELS[pairs.length % PRESET_LABELS.length];
    store.addPair(k, v, label);
  };

  const addRandomPairs = (n: number) => {
    for (let i = 0; i < n; i++) {
      const k = randomUnitVector(dim);
      const v = randomUnitVector(dim);
      const label = PRESET_LABELS[(pairs.length + i) % PRESET_LABELS.length];
      store.addPair(k, v, label);
    }
  };

  const [activeTab, setActiveTab] = useState<'ledger' | 'sandbox' | 'step-read' | 'theta'>('ledger');
  const [hoveredPairIndex, setHoveredPairIndex] = useState<number | null>(null);

  // Custom Input Sandbox State
  const [customKeyText, setCustomKeyText] = useState('gravity');
  const [customValText, setCustomValText] = useState('orbit');

  // Orthogonality-Angle (θ) Sandbox State
  const [refPairIndex, setRefPairIndex] = useState<number>(0);
  const [thetaDeg, setThetaDeg] = useState<number>(90);

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
    const label = `${customKeyText.trim()} → ${customValText.trim()}`;
    store.addPair(customKeyVector, customValVector, label);
    setCustomKeyText('');
    setCustomValText('');
  };

  // Orthogonality-Angle (θ) Sandbox — the single control that drives the
  // cross-talk term k_i . k_j directly. Keep refPairIndex in range as the
  // pair list shrinks (Clear, dim change) so the selector never points at a
  // pair that no longer exists.
  useEffect(() => {
    if (refPairIndex >= pairs.length) setRefPairIndex(0);
  }, [pairs.length, refPairIndex]);

  const refPair = pairs[refPairIndex] ?? pairs[0];
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const predictedCos = Math.cos(thetaRad);

  // The perpendicular direction is reseeded from the ref pair's id, not
  // Math.random — see seedFromId's comment above. Only theta moves the blend.
  const candidateKey = useMemo(() => {
    if (!refPair) return null;
    return makeKeyAtAngle(refPair.key, thetaRad, createRng(seedFromId(refPair.id, 17)));
  }, [refPair, thetaRad]);

  const candidateValue = useMemo(() => {
    if (!refPair) return null;
    return randomUnitVector(dim, createRng(seedFromId(refPair.id, 917)));
  }, [refPair, dim]);

  const measuredCos = candidateKey && refPair ? vectorDot(candidateKey, refPair.key) : 0;

  // Simulate the write against the live matrix without committing it, so the
  // slider can be dragged freely before anything actually changes M.
  const simulatedRecall = useMemo(() => {
    if (!refPair || !candidateKey || !candidateValue) return null;
    const simulatedMatrix = writeAssociation(matrix, candidateKey, candidateValue);
    const readout = readAssociation(simulatedMatrix, refPair.key);
    return cosineSimilarity(readout, refPair.value);
  }, [matrix, candidateKey, candidateValue, refPair]);

  const refPairCurrentRecall = recalls[refPairIndex]?.similarity ?? 1;

  const handleWriteAtAngle = () => {
    if (!refPair || !candidateKey || !candidateValue) return;
    store.addPair(candidateKey, candidateValue, `θ=${thetaDeg}° vs "${refPair.label}"`);
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
    <div>
      {/* Global Toolbar & Mode Tabs */}
      <Panel className="p-3 sm:p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-linen/80 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'ledger'
                ? 'bg-surface text-ink shadow-sm border border-border/80 font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Retrieval Fidelity
          </button>

          <button
            onClick={() => setActiveTab('step-read')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'step-read'
                ? 'bg-surface text-ink shadow-sm border border-border/80 font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Step-by-Step Readout (v̂ = M q)
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'sandbox'
                ? 'bg-surface text-ink shadow-sm border border-border/80 font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Custom Input Sandbox
          </button>

          <button
            onClick={() => setActiveTab('theta')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'theta'
                ? 'bg-surface text-ink shadow-sm border border-border/80 font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Orthogonality Angle (&theta;)
          </button>
        </div>

        {/* Quick Controls: Dimension & Add */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-linen/60 px-3 py-1.5 rounded-lg border border-border/80">
            <span className="text-xs font-mono text-ink-muted">DIM:</span>
            <select
              value={dim}
              onChange={e => store.setDim(Number(e.target.value))}
              aria-label="Memory dimension d"
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
              onClick={addRandomPair}
              className="px-3 py-1.5 rounded-lg bg-memory/15 text-memory hover:bg-memory/25 border border-memory/30 text-xs font-mono font-medium transition-all flex items-center gap-1"
              title="Inject 1 random association"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+1 Pair</span>
            </button>
            <button
              onClick={() => addRandomPairs(5)}
              className="px-3 py-1.5 rounded-lg bg-linen text-ink hover:bg-linen/80 border border-border text-xs font-mono font-medium transition-all"
              title="Inject 5 random associations"
            >
              +5 Pairs
            </button>
            <button
              onClick={() => store.clear()}
              className="px-2.5 py-1.5 rounded-lg text-interference/80 hover:text-interference hover:bg-interference/10 border border-interference/20 text-xs font-mono transition-all"
              title="Clear matrix back to zeros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Panel>

      {/* Tab 1: Truth vs Recall Ledger */}
      {activeTab === 'ledger' && (
        <Panel className="p-5 sm:p-6 flex flex-col justify-between mb-6 animate-fadeIn">
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
                  <button onClick={addRandomPair} className="text-memory underline font-mono hover:text-memory-dark">
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
                        <span className={`w-9 text-right font-bold text-[11px] ${statusColor}`}>{pct}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

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
        </Panel>
      )}

      {/* Tab 2: Step-by-Step Readout Visualizer (ciechanow.ski style) */}
      {activeTab === 'step-read' && (
        <Panel className="p-6 sm:p-8 mb-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-border/70">
            <div>
              <h3 className="text-xl font-display text-ink font-semibold m-0 mb-1 flex items-center gap-2">
                <span>Vector-Matrix Readout:</span>
                <code className="text-sm font-mono text-memory bg-memory/10 px-2 py-0.5 rounded border border-memory/30 font-normal">
                  &lang;<EquationTerm axis="v">v&#770;</EquationTerm>&rang; = <EquationTerm axis="m">M</EquationTerm> &middot;{' '}
                  <EquationTerm axis="k">q</EquationTerm>
                </code>
              </h3>
              <p className="text-xs text-ink-muted m-0">
                Inspect the dot product across each row of $M$ to see target signal accumulate vs. non-orthogonal keys cross-talk.
                Hover a symbol above — it lights up the matching region on the Stage diagram.
              </p>
            </div>

            {/* Pair Selector */}
            {pairs.length > 0 && (
              <div className="flex items-center gap-2 bg-linen px-3 py-1.5 rounded-lg border border-border">
                <span className="text-xs font-mono text-ink-muted">Query Pair:</span>
                <select
                  value={selectedPairIndex}
                  onChange={e => setSelectedPairIndex(Number(e.target.value))}
                  aria-label="Query pair for step-by-step readout"
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
                    className="px-3.5 py-1.5 rounded-md bg-memory text-canvas font-mono text-xs font-semibold hover:bg-memory-dark flex items-center gap-1.5 transition-colors shadow-sm"
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
                          <span key={c} className="px-1.5 py-0.5 rounded bg-surface border border-border text-[11px]">
                            ({t.mVal.toFixed(2)} &times; {t.qVal.toFixed(2)})
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-sm">
                        <span className="text-ink-muted">Calculated Output:</span>
                        <span className="font-bold text-memory">{rowResults[currentRowStep]?.sum.toFixed(4)}</span>
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
                    <div className="text-xs font-mono font-semibold uppercase text-ink-muted mb-2">Decomposition Analysis</div>
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
                          <span>
                            {item.isTarget ? 'Target: ' : 'Bleed: '}
                            {item.proj.toFixed(3)}
                          </span>
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
        </Panel>
      )}

      {/* Tab 3: Custom Input Sandbox */}
      {activeTab === 'sandbox' && (
        <Panel className="p-6 sm:p-8 mb-6 animate-fadeIn">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-display text-ink font-semibold mb-1">Custom Associative Write Sandbox</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Type custom semantic concepts to generate deterministic unit vectors $k$ and $v$, verify their orthogonality with existing memory, and inject them into State $M$.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-ink-muted uppercase">Key Concept (Query Trigger)</label>
                <input
                  type="text"
                  value={customKeyText}
                  onChange={e => setCustomKeyText(e.target.value)}
                  placeholder="e.g. proton, neuron, winter"
                  className="w-full bg-canvas border border-border rounded-lg p-2.5 text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-memory"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-ink-muted uppercase">Value Concept (Retrieved Memory)</label>
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
                  ? 'High orthogonality detected. Storing this pair will introduce negligible cross-talk.'
                  : maxKeyOverlap < 0.5
                  ? 'Moderate overlap. Recall will be slightly degraded by linear interference.'
                  : 'High directional overlap! This key is close to an existing vector and will cause mutual interference.'}
              </div>
            </div>

            {/* Inject Button */}
            <button
              onClick={handleInjectCustom}
              disabled={!customKeyText.trim() || !customValText.trim()}
              className="w-full py-2.5 rounded-lg bg-memory text-canvas font-semibold text-xs font-mono hover:bg-memory-dark disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>
                Write "{customKeyText || 'key'} &rarr; {customValText || 'val'}" into Memory Matrix
              </span>
            </button>
          </div>
        </Panel>
      )}

      {/* Tab 4: Orthogonality-Angle Sandbox — falsify "orthogonal keys -> no interference" in seconds */}
      {activeTab === 'theta' && (
        <Panel className="p-6 sm:p-8 mb-6 animate-fadeIn">
          <div className="mb-6">
            <h3 className="text-xl font-display text-ink font-semibold mb-1 flex items-center gap-2 flex-wrap">
              <span>Orthogonality Angle</span>
              <code className="text-sm font-mono text-interference bg-interference/10 px-2 py-0.5 rounded border border-interference/30 font-normal">
                k(&theta;) = cos&theta;&middot;k_ref + sin&theta;&middot;k&perp;
              </code>
            </h3>
            <p className="text-xs text-ink-muted m-0 max-w-2xl leading-relaxed">
              Construct a new key at an exact angle &theta; from a key already in memory — this drives the cross-talk
              term k<sub>i</sub>&middot;k<sub>j</sub> directly, instead of sampling it indirectly through random
              re-draws. At &theta;&nbsp;=&nbsp;90&deg; the keys are orthogonal and the claim holds. Drag toward
              0&deg; and watch recall break in real time, before you've written anything.
            </p>
          </div>

          {pairs.length === 0 ? (
            <div className="py-12 text-center text-ink-muted text-xs font-sans">
              <p className="mb-2">Add at least one pair to pick a reference key.</p>
              <button onClick={addRandomPair} className="text-memory underline font-mono hover:text-memory-dark">
                + Add a random association
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="bg-canvas border border-border rounded-xl p-4 mb-4">
                  <AngleGauge thetaDeg={thetaDeg} />
                  <p className="text-[10px] text-ink-faint font-sans mt-1 text-center leading-relaxed">
                    Illustrative 2D angle — k_ref and k(&theta;) actually live in {dim} dimensions; the angle is exact
                    by Gram-Schmidt construction, not a projection of the real vectors.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-linen px-3 py-1.5 rounded-lg border border-border mb-4">
                  <span className="text-xs font-mono text-ink-muted shrink-0">Reference Key:</span>
                  <select
                    value={refPairIndex}
                    onChange={e => setRefPairIndex(Number(e.target.value))}
                    aria-label="Reference key for the orthogonality-angle sandbox"
                    className="bg-transparent text-xs font-mono font-semibold text-ink focus:outline-none cursor-pointer min-w-0 flex-1"
                  >
                    {pairs.map((p, idx) => (
                      <option key={p.id} value={idx} className="bg-surface text-ink">
                        #{idx + 1}: {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label htmlFor="theta-slider" className="flex items-center justify-between text-xs font-mono text-ink-muted mb-1.5">
                  <span>&theta; (orthogonality angle)</span>
                  <span className="text-ink font-semibold">
                    {thetaDeg}&deg; = {thetaRad.toFixed(3)} rad
                  </span>
                </label>
                <input
                  id="theta-slider"
                  type="range"
                  min={0}
                  max={90}
                  step={1}
                  value={thetaDeg}
                  onChange={e => setThetaDeg(Number(e.target.value))}
                  aria-label="Orthogonality angle theta, in degrees, from the reference key"
                  className="w-full accent-interference"
                />
                <div className="flex justify-between text-[10px] text-ink-faint font-mono mt-1">
                  <span>0&deg; parallel &mdash; max interference</span>
                  <span>90&deg; orthogonal &mdash; zero interference</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-lg bg-canvas border border-border font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Predicted cos&theta;:</span>
                    <span className="font-bold text-ink">{predictedCos.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Measured k(&theta;)&middot;k_ref:</span>
                    <span className="font-bold text-truth">{measuredCos.toFixed(4)}</span>
                  </div>
                  <div className="text-[11px] text-ink-faint font-sans pt-1.5 border-t border-border/60 leading-relaxed">
                    These match by construction: <code className="text-ink">makeKeyAtAngle</code> blends an
                    orthonormal pair, so the dot product is exactly cos&theta; — not approximately.
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-canvas border border-border font-mono text-xs space-y-3">
                  <div className="text-ink-muted uppercase text-[11px] font-semibold">
                    Recall on "{refPair?.label}" if written now
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-ink-muted">Before write</span>
                      <span className="text-ink font-semibold">{(refPairCurrentRecall * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-linen rounded-full border border-border/80 overflow-hidden">
                      <div
                        className="h-full bg-ink-faint"
                        style={{ width: `${Math.max(0, Math.min(refPairCurrentRecall * 100, 100))}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-ink-muted">After write at &theta;={thetaDeg}&deg;</span>
                      <span
                        className={`font-semibold ${
                          (simulatedRecall ?? 1) >= 0.85 ? 'text-truth' : (simulatedRecall ?? 1) >= 0.65 ? 'text-memory' : 'text-interference'
                        }`}
                      >
                        {((simulatedRecall ?? 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-linen rounded-full border border-border/80 overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          (simulatedRecall ?? 1) >= 0.85 ? 'bg-truth' : (simulatedRecall ?? 1) >= 0.65 ? 'bg-memory' : 'bg-interference'
                        }`}
                        animate={{ width: `${Math.max(0, Math.min((simulatedRecall ?? 1) * 100, 100))}%` }}
                        transition={{ duration: 0.15 }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleWriteAtAngle}
                  className="w-full py-2.5 rounded-lg bg-interference/15 text-interference hover:bg-interference/25 border border-interference/40 font-medium text-xs font-mono transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Write key at &theta;={thetaDeg}&deg; from "{refPair?.label}" into Memory Matrix
                  </span>
                </button>
              </div>
            </div>
          )}
        </Panel>
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
          className="text-memory underline"
        >
          BDH Paper (arXiv:2509.26507, Eq. 5&ndash;7) &rarr;
        </a>
      </p>
    </div>
  );
};
