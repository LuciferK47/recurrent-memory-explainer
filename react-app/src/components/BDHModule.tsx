import React, { useState } from 'react';

// ARC Colors palette for the original illustration grid
const ARC_COLORS: Record<number, string> = {
  0: '#1a1a2e',
  1: '#c04928', // interference / red tone
  2: '#1b7a4e', // truth / green tone
  3: '#1d6fa5', // memory / blue tone
  4: '#d97706', // amber
  5: '#444141',
  6: '#7c3aed',
  7: '#ea580c',
  8: '#0081c0',
  9: '#646464',
};

// Original illustrative ARC task demo data
const DEMO_STEPS = [
  {
    step: 1,
    title: 'See Demo Pair #1',
    description: 'The model receives an input→output example: "Fill the enclosed 3x3 region with green."',
    inputGrid: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ],
    outputGrid: [
      [1, 1, 1, 1, 1],
      [1, 2, 2, 2, 1],
      [1, 2, 2, 2, 1],
      [1, 2, 2, 2, 1],
      [1, 1, 1, 1, 1],
    ],
    explanation: 'Demonstration 1 is tokenized and prepared for projection into key and value representation.',
  },
  {
    step: 2,
    title: 'Write Demo #1 into Recurrent State',
    description: 'The demo is encoded and written into the fixed-size state matrix via Hebbian update. State accumulates additively — same outer-product write.',
    hasMatrix: true,
    matrixHighlight: 'M_1 = v_1 · k_1^T',
    explanation: 'Synaptic connections are reinforced between the input boundary representation and the filled region output.',
  },
  {
    step: 3,
    title: 'See Demo Pair #2 → Write Again',
    description: 'A second example reinforces the pattern: "Enclosed region with different boundary". State grows richer.',
    inputGrid: [
      [3, 3, 3, 3],
      [3, 0, 0, 3],
      [3, 0, 0, 3],
      [3, 3, 3, 3],
    ],
    outputGrid: [
      [3, 3, 3, 3],
      [3, 2, 2, 3],
      [3, 2, 2, 3],
      [3, 3, 3, 3],
    ],
    hasMatrix: true,
    matrixHighlight: 'M_2 = M_1 + v_2 · k_2^T',
    explanation: 'Hebbian update writes demonstration 2 into the existing state. Rank of M increases.',
  },
  {
    step: 4,
    title: 'Test: Apply Learned Rule to New Input',
    description: 'The model reads from its recurrent state to predict the output for an unseen input. No gradient update was needed — the rule was absorbed into the state.',
    testInput: [
      [4, 4, 4, 4, 4],
      [4, 0, 0, 0, 4],
      [4, 0, 0, 0, 4],
      [4, 4, 4, 4, 4],
    ],
    testPredicted: [
      [4, 4, 4, 4, 4],
      [4, 2, 2, 2, 4],
      [4, 2, 2, 2, 4],
      [4, 4, 4, 4, 4],
    ],
    explanation: 'Linear readout M · q retrieves the transformation rule, solving the test example in one forward pass.',
  },
];

function renderMiniGrid(grid: number[][]) {
  const rows = grid.length;
  const cols = grid[0].length;
  return (
    <div
      className="inline-grid gap-[2px] bg-ink border border-border p-1 rounded"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {grid.map((row, r) =>
        row.map((val, c) => (
          <div
            key={`${r}-${c}`}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-[1px]"
            style={{ backgroundColor: ARC_COLORS[val] || ARC_COLORS[0] }}
          />
        ))
      )}
    </div>
  );
}

export const BDHModule: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const stepData = DEMO_STEPS[currentStep];

  return (
    <section id="bdh" className="py-16 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-sm font-display text-ink-muted mb-2">03 BDH Connection</div>
        <h2 className="text-3xl sm:text-4xl font-display text-ink mb-3">
          How BDH and BDH-CQ Use This Mechanism
        </h2>
        <p className="text-base text-ink-muted max-w-2xl mb-8 leading-relaxed">
          The outer-product write you just used <em>is</em> BDH's core memory mechanism. Here's how it works in the actual architecture.
        </p>

        {/* Learning Objective Card */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-display text-ink mb-2">Learning Objective</h3>
          <p className="text-sm text-ink leading-relaxed m-0">
            After this section, you should be able to explain:{' '}
            <strong>
              BDH stores attention as synaptic memory that updates via Hebbian writes as the model reads. BDH-CQ extends this to absorb demonstration examples into recurrent state — enabling in-context learning without gradient updates.
            </strong>
          </p>
        </div>

        {/* BDH Architecture Overview Card */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-xl font-display text-ink mb-3">BDH: Attention as Synaptic Memory</h3>
          <p className="text-sm text-ink leading-relaxed mb-4">
            In a standard Transformer, attention is a lookup: query against stored keys to retrieve values. In{' '}
            <strong>BDH</strong> (
            <a
              href="https://arxiv.org/abs/2509.26507"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2509.26507
            </a>
            ), this lookup is reformulated as <em>synaptic memory</em> — connections between neuron-like units that strengthen when related concepts co-occur.
          </p>

          <div className="bg-linen border border-border rounded-lg p-4 mb-4 text-center">
            <span className="font-mono text-ink text-sm sm:text-base font-medium">
              S(t) = S(t−1) + η · v(t) · k(t)<sup>T</sup> &nbsp;&nbsp;(Hebbian synaptic update)
            </span>
          </div>

          <p className="text-sm text-ink leading-relaxed mb-3">
            This is exactly the outer-product write <code>M &larr; M + v &middot; k<sup>T</sup></code> you used in Section 2.{' '}
            <strong>S</strong> is the synapse matrix (fixed-size), <strong>v</strong> and <strong>k</strong> are the value and key at time <em>t</em>, and <strong>η</strong> is a learning rate.
          </p>

          <p className="text-xs text-ink-muted leading-relaxed m-0 border-t border-border pt-3">
            Key distinction: BDH is <em>not</em> an SSM in the Mamba sense. BDH models neuron-synapse interactions on a scale-free graph; BDH-GPU is a separate GPU-friendly reformulation using ReLU/low-rank transformations with linear attention (
            <a
              href="https://arxiv.org/abs/2509.26507"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2509.26507
            </a>
            , Section 4).
          </p>
        </div>

        {/* BDH-CQ Walkthrough Step-Through Card */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-xl font-display text-ink m-0">BDH-CQ: Learning from Demonstrations</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded border border-border bg-linen text-ink">
              illustration
            </span>
          </div>

          <p className="text-sm text-ink-muted mb-6">
            <strong>BDH-CQ</strong> (
            <a
              href="https://arxiv.org/abs/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2608.09888
            </a>
            ) extends BDH to learn from a few demonstration examples at inference time. Each demo pair is written into recurrent state. No gradient update. No chain-of-thought tokens. Click through to explore:
          </p>

          {/* Stepper Navigation */}
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-3">
            {DEMO_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentStep === idx
                    ? 'bg-memory text-surface font-semibold'
                    : 'bg-linen text-ink-muted hover:text-ink'
                }`}
              >
                Step {s.step}
              </button>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="bg-linen/50 border border-border rounded-lg p-5 mb-6">
            <div className="text-xs font-mono font-semibold text-memory uppercase mb-1">
              Step {stepData.step} of 4
            </div>
            <h4 className="text-lg font-display text-ink mb-2">{stepData.title}</h4>
            <p className="text-sm text-ink mb-4">{stepData.description}</p>

            {/* Visual demo grids */}
            {stepData.inputGrid && stepData.outputGrid && (
              <div className="flex flex-wrap items-center justify-center gap-6 my-4 p-4 bg-surface rounded border border-border">
                <div className="text-center">
                  <div className="text-[11px] font-mono text-ink-muted uppercase mb-1">Input Grid</div>
                  {renderMiniGrid(stepData.inputGrid)}
                </div>
                <div className="text-ink-muted text-xl">&rarr;</div>
                <div className="text-center">
                  <div className="text-[11px] font-mono text-ink-muted uppercase mb-1">Demonstration Output</div>
                  {renderMiniGrid(stepData.outputGrid)}
                </div>
              </div>
            )}

            {stepData.hasMatrix && (
              <div className="my-4 p-4 bg-surface rounded border border-border flex flex-col items-center">
                <div className="text-xs font-mono text-memory font-medium mb-2">
                  {stepData.matrixHighlight}
                </div>
                <div className="w-32 h-32 bg-linen border border-border rounded grid grid-cols-4 grid-rows-4 gap-1 p-2">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-sm"
                      style={{
                        backgroundColor: i % 3 === 0 ? '#1d6fa5' : i % 5 === 0 ? '#c04928' : '#f0f2ee',
                        opacity: 0.85,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {stepData.testInput && stepData.testPredicted && (
              <div className="flex flex-wrap items-center justify-center gap-6 my-4 p-4 bg-surface rounded border border-border">
                <div className="text-center">
                  <div className="text-[11px] font-mono text-ink-muted uppercase mb-1">Test Input</div>
                  {renderMiniGrid(stepData.testInput)}
                </div>
                <div className="text-ink-muted text-xl">&rarr;</div>
                <div className="text-center">
                  <div className="text-[11px] font-mono text-truth font-semibold uppercase mb-1">Retrieved Output</div>
                  {renderMiniGrid(stepData.testPredicted)}
                </div>
              </div>
            )}

            <p className="text-xs text-ink-muted m-0 italic">{stepData.explanation}</p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="border border-border text-ink hover:bg-linen disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              &larr; Previous
            </button>
            <button
              onClick={() => setCurrentStep(prev => Math.min(DEMO_STEPS.length - 1, prev + 1))}
              disabled={currentStep === DEMO_STEPS.length - 1}
              className="border border-memory text-memory hover:bg-memory/10 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              Next Step &rarr;
            </button>
          </div>

          <p className="text-xs text-ink-muted italic border-t border-border pt-3 mt-6 mb-0">
            This walkthrough illustrates the published BDH-CQ mechanism (
            <a
              href="https://arxiv.org/abs/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline not-italic"
            >
              arXiv:2608.09888
            </a>
            , Section 3). It is not live BDH-CQ inference. Grid tasks are original examples, not from the ARC-AGI dataset.
          </p>
        </div>
      </div>
    </section>
  );
};
