import React, { useState, useMemo } from 'react';
import { READOUT_EQUATION_HTML, ORTHOGONALITY_EQUATION_HTML } from '../lib/prerendered-katex';
import { Reveal } from './ui/Reveal';
import { Panel } from './ui/Panel';

type Verdict = 'correct' | 'partial' | 'wrong';

interface ConceptCheck {
  key: string;
  label: string;
  hint: string;
  met: boolean;
}

export const CheckUnderstanding: React.FC = () => {
  const [response, setResponse] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Concept keyword analyzer — the same three checks that always existed
  // here, now surfaced individually as a checklist instead of only being
  // summed into one hidden score.
  const analysis = useMemo(() => {
    const lower = response.toLowerCase();

    const hasOrthogonality = lower.includes('orthogon') || lower.includes('perpendicular') || lower.includes('angle');
    const hasDimension = lower.includes('dimension') || lower.includes('rank') || lower.includes('basis') || lower.includes('space') || lower.includes('independent');
    const hasInterference = lower.includes('cross') || lower.includes('interfer') || lower.includes('bleed') || lower.includes('overlap') || lower.includes('dot product') || lower.includes('inner product') || lower.includes('noise');

    const score = (hasOrthogonality ? 1 : 0) + (hasDimension ? 1 : 0) + (hasInterference ? 1 : 0);

    return { hasOrthogonality, hasDimension, hasInterference, score };
  }, [response]);

  const concepts: ConceptCheck[] = [
    {
      key: 'orthogonality',
      label: 'Orthogonality',
      hint: 'names orthogonal/perpendicular keys, or the angle between them',
      met: analysis.hasOrthogonality,
    },
    {
      key: 'dimension',
      label: 'd-dimension bound',
      hint: 'names dimension, rank, basis, or linear independence',
      met: analysis.hasDimension,
    },
    {
      key: 'interference',
      label: 'Cross-talk',
      hint: 'names cross-talk, interference, overlap, or dot/inner products',
      met: analysis.hasInterference,
    },
  ];

  // Explicit tri-state verdict, not just a vague "recorded" badge: all three
  // concepts named is Correct; one or two is Partially right; zero is Not
  // quite yet — each with copy that says so in plain words.
  const verdict: Verdict = analysis.score === 3 ? 'correct' : analysis.score >= 1 ? 'partial' : 'wrong';

  const verdictCopy: Record<Verdict, { title: string; body: string }> = {
    correct: {
      title: 'Correct',
      body: 'You named all three pieces: orthogonality, the d-dimension bound, and cross-talk interference. That is the full mechanism.',
    },
    partial: {
      title: 'Partially right',
      body: `You're onto part of the mechanism, but missing ${3 - analysis.score} concept${3 - analysis.score === 1 ? '' : 's'} below — check the list, then the derivation.`,
    },
    wrong: {
      title: 'Not quite yet',
      body: "Your explanation doesn't touch the key mechanism yet. Work through the concept checklist below, then the derivation.",
    },
  };

  // Tailwind's build scans source files for literal class strings — a
  // template-literal like `bg-${tone}/10` is invisible to that scan and
  // ships with no styling at all, so each verdict's classes are spelled out
  // in full here rather than assembled from a color-name variable.
  const verdictClasses: Record<Verdict, { banner: string; badge: string; title: string }> = {
    correct: {
      banner: 'bg-truth/10 border-truth/30',
      badge: 'bg-truth',
      title: 'text-truth',
    },
    partial: {
      banner: 'bg-data/10 border-data/30',
      badge: 'bg-data',
      title: 'text-data',
    },
    wrong: {
      banner: 'bg-interference/10 border-interference/30',
      badge: 'bg-interference',
      title: 'text-interference',
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) return;
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setResponse('');
    setIsSubmitted(false);
    setShowHint(false);
    setShowSolution(false);
  };

  const vc = verdictClasses[verdict];

  return (
    <Reveal className="my-8">
    <Panel tone="memory" className="p-6 sm:p-8">
      {/* Header Badge & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-memory/10 text-memory border border-memory/25 font-semibold">
            Interactive Self-Check
          </span>
          <h3 className="text-lg sm:text-xl font-display text-ink font-semibold m-0">
            Check Your Understanding
          </h3>
        </div>
        {isSubmitted && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-ink-muted hover:text-ink font-mono underline transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Question Prompt */}
      <p className="text-sm text-ink leading-relaxed mb-4">
        In your own words: why does recall degrade after the number of stored associations exceeds the memory dimension <span className="font-serif italic font-semibold">d</span>? What would happen if all keys were perfectly orthogonal?
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Explain the algebraic or geometric intuition here (e.g. key overlap, dot products, vector basis bounds)…"
            rows={3}
            className="w-full bg-canvas/90 border border-border rounded-lg p-3.5 text-sm text-ink font-sans placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-memory/40 focus:border-memory transition-all resize-y"
          />
          {response.length > 0 && (
            <div className="absolute right-3 bottom-3 text-[11px] font-mono text-ink-muted pointer-events-none">
              {response.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={!response.trim()}
            className="px-4 py-2 rounded-lg bg-memory text-canvas font-semibold text-xs sm:text-sm hover:bg-memory-dark active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Verify Explanation</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHint(prev => !prev)}
            className="px-3 py-2 rounded-lg bg-linen/70 hover:bg-linen text-ink-muted hover:text-ink border border-border/70 text-xs font-mono transition-colors"
          >
            {showHint ? 'Hide Hint' : 'Hint'}
          </button>
        </div>
      </form>

      {/* Collapsible Hint */}
      {showHint && (
        <div className="mt-4 p-3.5 rounded-lg bg-linen/50 border border-border/60 text-xs text-ink-muted leading-relaxed animate-fadeIn">
          <span className="font-semibold text-ink font-mono">Hint:</span> Think about what happens to{' '}
          <code className="bg-canvas px-1 py-0.5 rounded font-mono text-[11px] border border-border/60">M &middot; q</code>{' '}
          when <code className="bg-canvas px-1 py-0.5 rounded font-mono text-[11px] border border-border/60">q</code> is similar to multiple stored keys. If keys are orthogonal, cross-terms vanish &mdash; but in{' '}
          <span className="font-serif italic font-semibold">d</span> dimensions, what is the maximum number of mutually orthogonal vectors you can have?
        </div>
      )}

      {/* Verdict + Concept Checklist — the whole point of submitting: say
          plainly whether the answer was right, partially right, or wrong,
          then show exactly which of the three graded concepts were and
          weren't named. */}
      {isSubmitted && (
        <div className="mt-5 pt-4 border-t border-border/70 animate-fadeIn space-y-4" aria-live="polite">
          <div className={`flex items-start gap-3 p-3.5 rounded-lg border ${vc.banner}`}>
            <span
              aria-hidden="true"
              className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-canvas ${vc.badge}`}
            >
              {verdict === 'correct' ? '✓' : verdict === 'partial' ? '!' : '×'}
            </span>
            <div>
              <div className={`text-sm font-semibold ${vc.title}`}>{verdictCopy[verdict].title}</div>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed m-0">{verdictCopy[verdict].body}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wide text-ink-muted font-semibold">
              Concept Checklist
            </div>
            {concepts.map(c => (
              <div
                key={c.key}
                className={`flex items-start gap-2.5 text-xs p-2 rounded-md border ${
                  c.met ? 'bg-truth/5 border-truth/25' : 'bg-linen/50 border-border/60'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`shrink-0 mt-0.5 w-[18px] h-[18px] rounded-full border flex items-center justify-center text-[11px] font-bold ${
                    c.met ? 'bg-truth border-truth text-canvas' : 'border-ink-faint/60 text-transparent'
                  }`}
                >
                  {c.met ? '✓' : '–'}
                </span>
                <div>
                  <span className={`font-medium ${c.met ? 'text-ink' : 'text-ink-muted'}`}>{c.label}</span>
                  <span className="text-ink-faint"> &mdash; {c.hint}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowSolution(prev => !prev)}
            className="text-xs font-mono text-memory hover:underline transition-all"
          >
            {showSolution ? 'Hide the derivation' : 'Show the derivation'}
          </button>
        </div>
      )}

      {/* Theoretical Solution & Derivation */}
      {showSolution && (
        <div className="mt-4 p-5 rounded-lg bg-canvas/70 border border-border text-sm text-ink leading-relaxed animate-fadeIn">
          <div className="font-display font-semibold text-ink text-base mb-2 flex items-center gap-2">
            <span>Theoretical Derivation</span>
            <span className="text-[11px] font-mono font-normal text-ink-muted">(Exact Orthogonality Theorem)</span>
          </div>

          <div
            className="my-3 overflow-x-auto text-center py-2"
            dangerouslySetInnerHTML={{ __html: READOUT_EQUATION_HTML }}
          />

          <p className="text-xs sm:text-sm text-ink leading-relaxed mb-2">
            When querying memory with query <span className="font-mono text-xs">q</span> for stored pair <span className="font-mono text-xs">j</span>:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-ink mb-3 pl-1">
            <li>
              <strong>If keys are mutually orthonormal:</strong> The inner products satisfy{' '}
              <span dangerouslySetInnerHTML={{ __html: ORTHOGONALITY_EQUATION_HTML }} />. The cross-terms{' '}
              <span className="font-mono text-xs">&sum; v_i(k_i^T q)</span> vanish to exactly zero, yielding perfect noiseless recall{' '}
              <span className="font-mono text-xs">v_j</span>.
            </li>
            <li>
              <strong>The dimensional bottleneck:</strong> In a vector space of dimension{' '}
              <span className="font-serif italic font-semibold">d</span>, the maximum number of linearly independent (and mutually orthogonal) vectors is strictly{' '}
              <span className="font-serif italic font-semibold">d</span>.
            </li>
            <li>
              <strong>Inevitability of interference:</strong> Once <span className="font-serif italic font-semibold">N &gt; d</span>, any set of keys must be linearly dependent. Cross-talk terms can no longer vanish simultaneously. Random keys begin having non-zero projection angles, contaminating the recalled vector with a linear superposition of all previously stored values.
            </li>
          </ol>
        </div>
      )}
    </Panel>
    </Reveal>
  );
};
