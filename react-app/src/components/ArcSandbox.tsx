import React, { useMemo, useState } from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import {
  createZeroMatrix,
  writeAssociation,
  readAssociation,
  encodeGrid,
  decodeGrid,
  GridCandidate,
  GridDecodeResult,
} from '../lib/memory-math';
import { ARC_COLORS, renderMiniGrid } from './BDHModule';

/**
 * Playable ARC-style sandbox: pick a transform rule, write two worked
 * demonstrations into a small local associative matrix (the same
 * writeAssociation/readAssociation used everywhere else on this page), then
 * author a test grid by clicking its cells and ask the matrix to retrieve an
 * output for it. Decoding is nearest-neighbour cosine match against the
 * demonstrations' own encoded outputs — a real, different (and simpler)
 * mechanism than actual BDH-CQ inference, which is exactly why this stays
 * labelled "illustration" throughout, matching BDHModule's walkthrough.
 */

const SANDBOX_DIM = 24;
const ENCODE_SEED = 4242;
const PALETTE = [0, 1, 2, 3] as const;

interface TransformRule {
  id: string;
  name: string;
  description: string;
  apply: (g: number[][]) => number[][];
}

const swapColors = (g: number[][], a: number, b: number) => g.map(row => row.map(v => (v === a ? b : v === b ? a : v)));
const mirrorHorizontal = (g: number[][]) => g.map(row => [...row].reverse());
const rotate180 = (g: number[][]) => [...g].reverse().map(row => [...row].reverse());

const RULES: TransformRule[] = [
  { id: 'swap12', name: 'Swap Colors 1 ↔ 2', description: 'Every red cell becomes green and vice versa.', apply: g => swapColors(g, 1, 2) },
  { id: 'mirror', name: 'Mirror Horizontal', description: 'Flip the grid left-to-right.', apply: mirrorHorizontal },
  { id: 'rotate180', name: 'Rotate 180°', description: 'Rotate the grid by half a turn.', apply: rotate180 },
];

const BASE_GRID_A = [
  [0, 1, 0, 0],
  [1, 1, 1, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 2],
];
const BASE_GRID_B = [
  [2, 0, 0, 1],
  [0, 2, 0, 1],
  [0, 0, 2, 1],
  [3, 3, 3, 0],
];
const DEFAULT_TEST_GRID = [
  [0, 1, 0, 0],
  [1, 1, 1, 0],
  [0, 1, 0, 2],
  [0, 0, 0, 2],
];

function gridsEqual(a: number[][], b: number[][]): boolean {
  return a.length === b.length && a.every((row, r) => row.length === b[r].length && row.every((v, c) => v === b[r][c]));
}

/** Count of differing cells — raw grid-space distance, independent of encodeGrid. */
function gridDistance(a: number[][], b: number[][]): number {
  let d = 0;
  for (let r = 0; r < a.length; r++) for (let c = 0; c < a[r].length; c++) if (a[r][c] !== b[r][c]) d++;
  return d;
}

function EditableGrid({ grid, onCellClick }: { grid: number[][]; onCellClick: (r: number, c: number) => void }) {
  const cols = grid[0].length;
  return (
    <div
      className="inline-grid gap-[2px] bg-canvas border border-border p-1 rounded"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {grid.map((row, r) =>
        row.map((val, c) => (
          <button
            key={`${r}-${c}`}
            type="button"
            onClick={() => onCellClick(r, c)}
            aria-label={`Cell row ${r + 1}, column ${c + 1}, color ${val}. Click to cycle color.`}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-[1px] cursor-pointer hover:ring-2 hover:ring-white/60 transition-all"
            style={{ backgroundColor: ARC_COLORS[val] || ARC_COLORS[0] }}
          />
        ))
      )}
    </div>
  );
}

export const ArcSandbox: React.FC = () => {
  const [ruleId, setRuleId] = useState(RULES[0].id);
  const rule = RULES.find(r => r.id === ruleId) ?? RULES[0];

  const [written, setWritten] = useState(false);
  const [testGrid, setTestGrid] = useState<number[][]>(DEFAULT_TEST_GRID);
  const [result, setResult] = useState<GridDecodeResult | null>(null);

  const demoA = useMemo(() => ({ input: BASE_GRID_A, output: rule.apply(BASE_GRID_A) }), [rule]);
  const demoB = useMemo(() => ({ input: BASE_GRID_B, output: rule.apply(BASE_GRID_B) }), [rule]);

  // The mechanism is a classifier over exactly two known outputs — it can
  // never reproduce rule.apply(testGrid) unless testGrid IS a demo input, so
  // that can't be the success criterion (comparing against it would call
  // correct behavior "wrong" on every genuinely new grid). The honest,
  // achievable target: did it retrieve the SAME demo's output that the test
  // grid is actually closest to in raw grid space? A "miss" here is the
  // real, interesting failure mode — the query confused the two demos.
  const nearestDemo = useMemo(
    () => (gridDistance(testGrid, BASE_GRID_A) <= gridDistance(testGrid, BASE_GRID_B) ? demoA : demoB),
    [testGrid, demoA, demoB]
  );
  // Purely informational — see the note rendered below when this differs
  // from nearestDemo.output: what the rule would give if actually applied,
  // vs. what nearest-neighbour recall over two known outputs can return.
  const trueOutput = useMemo(() => rule.apply(testGrid), [rule, testGrid]);

  const handleRuleChange = (id: string) => {
    setRuleId(id);
    setWritten(false);
    setTestGrid(DEFAULT_TEST_GRID);
    setResult(null);
  };

  const handleWriteDemos = () => {
    setWritten(true);
    setResult(null);
  };

  const handleCellClick = (r: number, c: number) => {
    setTestGrid(prev => {
      const next = prev.map(row => [...row]);
      const idx = PALETTE.indexOf(next[r][c] as (typeof PALETTE)[number]);
      next[r][c] = PALETTE[(idx + 1) % PALETTE.length];
      return next;
    });
    setResult(null);
  };

  const handlePredict = () => {
    // Build the local matrix fresh from the two demonstrations -- a real
    // outer-product write, not a lookup table; see writeAssociation.
    let M = createZeroMatrix(SANDBOX_DIM);
    const kA = encodeGrid(demoA.input, SANDBOX_DIM, ENCODE_SEED);
    const vA = encodeGrid(demoA.output, SANDBOX_DIM, ENCODE_SEED + 1);
    const kB = encodeGrid(demoB.input, SANDBOX_DIM, ENCODE_SEED);
    const vB = encodeGrid(demoB.output, SANDBOX_DIM, ENCODE_SEED + 1);
    M = writeAssociation(M, kA, vA);
    M = writeAssociation(M, kB, vB);

    const qTest = encodeGrid(testGrid, SANDBOX_DIM, ENCODE_SEED);
    const vhat = readAssociation(M, qTest);

    const candidates: GridCandidate[] = [
      { grid: demoA.output, vector: vA },
      { grid: demoB.output, vector: vB },
    ];
    setResult(decodeGrid(vhat, candidates));
  };

  const isCorrect = result ? gridsEqual(result.grid, nearestDemo.output) : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-mono text-ink-muted uppercase mb-2">1. Pick a Transform Rule</div>
        <div className="flex flex-wrap gap-2">
          {RULES.map(r => (
            <button
              key={r.id}
              onClick={() => handleRuleChange(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                ruleId === r.id
                  ? 'bg-synapse/15 text-synapse border border-synapse/50 font-semibold'
                  : 'bg-surface border border-border/80 text-ink-muted hover:text-ink hover:bg-surface-elevated'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-muted mt-2">{rule.description}</p>
      </div>

      <div>
        <div className="text-[11px] font-mono text-ink-muted uppercase mb-2">2. Write Two Demonstrations</div>
        <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-surface rounded-lg border border-border/80">
          {[demoA, demoB].map((demo, i) => (
            <div key={i} className="flex items-center gap-3">
              {renderMiniGrid(demo.input)}
              <span className="text-ink-muted text-lg">&rarr;</span>
              {renderMiniGrid(demo.output)}
            </div>
          ))}
        </div>
        <button
          onClick={handleWriteDemos}
          className="mt-3 w-full py-2 rounded-lg bg-memory/15 text-memory hover:bg-memory/25 border border-memory/40 font-medium text-xs font-mono transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{written ? 'Re-written into local state' : 'Write Both Demo Pairs into Local Memory Matrix'}</span>
        </button>
      </div>

      <div>
        <div className="text-[11px] font-mono text-ink-muted uppercase mb-2 flex items-center justify-between">
          <span>3. Author a Test Input — click cells to change color</span>
          <button
            onClick={() => {
              setTestGrid(DEFAULT_TEST_GRID);
              setResult(null);
            }}
            className="text-ink-faint hover:text-ink flex items-center gap-1 normal-case font-sans text-[11px]"
          >
            <RotateCcw className="w-3 h-3" /> reset grid
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-surface rounded-lg border border-border/80">
          <EditableGrid grid={testGrid} onCellClick={handleCellClick} />
          <span className="text-ink-muted text-lg">&rarr;</span>
          <div className="text-center">
            <div className="text-[10px] font-mono text-ink-faint uppercase mb-1">Retrieved (v&#770; decoded)</div>
            {result ? (
              renderMiniGrid(result.grid)
            ) : (
              <div className="w-[104px] h-[104px] sm:w-[120px] sm:h-[120px] rounded border border-dashed border-border flex items-center justify-center text-[10px] text-ink-faint text-center px-2">
                Press Predict
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={!written}
          className="mt-3 w-full py-2.5 rounded-lg bg-truth/15 text-truth hover:bg-truth/25 border border-truth/40 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs font-mono transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{written ? 'Predict: Read q_test from Local Memory Matrix' : 'Write demo pairs first'}</span>
        </button>
      </div>

      {result && (
        <div className="p-4 rounded-lg bg-canvas border border-border">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-mono">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-truth" />
                  <span className="text-truth font-semibold">Retrieved the nearest demo's output</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-interference" />
                  <span className="text-interference font-semibold">Retrieved the OTHER demo's output — the query confused the two</span>
                </>
              )}
            </div>
            <span className="text-[11px] font-mono text-ink-muted">
              cos similarity to matched demo: <strong className="text-ink">{result.similarity.toFixed(3)}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-[10px] font-mono text-ink-faint uppercase mb-1">Retrieved</div>
              {renderMiniGrid(result.grid)}
            </div>
            <div className="text-center">
              <div className="text-[10px] font-mono text-truth uppercase mb-1">
                Nearest Demo's Output ({nearestDemo === demoA ? 'Demo A' : 'Demo B'}, by raw grid similarity)
              </div>
              {renderMiniGrid(nearestDemo.output)}
            </div>
          </div>
          <p className="text-[11px] text-ink-muted mt-3 leading-relaxed">
            This decoder classifies against exactly two known outputs — it can only ever return one of them, never a genuinely new grid.
            "Correct" here means it picked the demo the test grid actually resembles more; that's achievable. Edit cells above until the
            test grid sits roughly halfway between the two demos and predict again — retrieval starts flipping unpredictably, the same
            capacity-driven interference the rest of this page teaches.
          </p>
          {!gridsEqual(trueOutput, nearestDemo.output) && (
            <p className="text-[11px] text-ink-faint mt-2 pt-2 border-t border-border/60 leading-relaxed">
              For reference, applying <strong className="text-ink">{rule.name}</strong> directly to this exact grid would give a third,
              different result than either demo's output — the generalization gap between "recall the nearest known example" and
              "actually apply the rule," which this sandbox cannot close with two demonstrations.
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] text-ink-faint italic border-t border-border/70 pt-3">
        This sandbox encodes grids via a seeded random projection (<code className="text-ink not-italic">encodeGrid</code>) and decodes
        by nearest-neighbour cosine match against the demonstrations' own outputs (<code className="text-ink not-italic">decodeGrid</code>
        ) — a simplified illustration of "grid → vector → outer-product write," not real BDH-CQ inference.
      </p>
    </div>
  );
};
