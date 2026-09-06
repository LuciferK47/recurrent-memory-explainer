import React, { useState, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const CheckUnderstanding: React.FC = () => {
  const [response, setResponse] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Concept keyword analyzer
  const analysis = useMemo(() => {
    if (!response.trim()) return null;
    const lower = response.toLowerCase();

    const hasOrthogonality = lower.includes('orthogon') || lower.includes('perpendicular') || lower.includes('angle');
    const hasDimension = lower.includes('dimension') || lower.includes('rank') || lower.includes('basis') || lower.includes('space') || lower.includes('independent');
    const hasInterference = lower.includes('cross') || lower.includes('interfer') || lower.includes('bleed') || lower.includes('overlap') || lower.includes('dot product') || lower.includes('inner product') || lower.includes('noise');

    const score = (hasOrthogonality ? 1 : 0) + (hasDimension ? 1 : 0) + (hasInterference ? 1 : 0);

    return {
      hasOrthogonality,
      hasDimension,
      hasInterference,
      score,
    };
  }, [response]);

  const mathEquation1 = useMemo(() => {
    try {
      return katex.renderToString(
        '\\hat{v} = M q = \\left(\\sum_{i=1}^N v_i k_i^\\top\\right) q = v_j (k_j^\\top q) + \\sum_{i \\ne j} v_i (k_i^\\top q)',
        { displayMode: true, throwOnError: false }
      );
    } catch {
      return 'v = M q';
    }
  }, []);

  const mathEquation2 = useMemo(() => {
    try {
      return katex.renderToString('k_i^\\top k_j = \\delta_{ij}', {
        throwOnError: false,
      });
    } catch {
      return 'k_i . k_j = 0';
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) return;
    setIsSubmitted(true);
    setShowSolution(true);
  };

  const handleReset = () => {
    setResponse('');
    setIsSubmitted(false);
    setShowSolution(false);
  };

  return (
    <div className="bg-surface/80 border border-border/80 rounded-xl p-6 sm:p-8 my-8 shadow-md backdrop-blur-sm transition-all">
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
            <div className="absolute right-3 bottom-3 text-[11px] font-mono text-ink-muted/60 pointer-events-none">
              {response.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          )}
        </div>

        {/* Buttons & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!response.trim()}
              className="px-4 py-2 rounded-lg bg-memory text-white font-medium text-xs sm:text-sm hover:bg-memory-dark active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
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

          {response.trim() && (
            <button
              type="button"
              onClick={() => setShowSolution(prev => !prev)}
              className="text-xs font-mono text-memory hover:underline transition-all"
            >
              {showSolution ? 'Hide Theoretical Solution' : 'View Theoretical Solution'}
            </button>
          )}
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

      {/* Automated Concept Feedback */}
      {isSubmitted && analysis && (
        <div className="mt-5 pt-4 border-t border-border/70 animate-fadeIn space-y-3">
          <div className="flex items-center gap-2">
            {analysis.score >= 2 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-truth/15 text-truth border border-truth/30">
                <span>&#x2713;</span> Strong Mathematical Intuition
              </span>
            ) : analysis.score === 1 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-memory/15 text-memory border border-memory/30">
                <span>&#x2139;</span> Good Foundation Identified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-linen text-ink border border-border">
                <span>&#x25CF;</span> Formulation Recorded
              </span>
            )}
            <span className="text-xs text-ink-muted">
              {analysis.score >= 2
                ? 'Your explanation touches on dimensionality bounds and cross-talk interference.'
                : 'Compare with the formal linear algebraic derivation below:'}
            </span>
          </div>
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
            dangerouslySetInnerHTML={{ __html: mathEquation1 }}
          />

          <p className="text-xs sm:text-sm text-ink leading-relaxed mb-2">
            When querying memory with query <span className="font-mono text-xs">q</span> for stored pair <span className="font-mono text-xs">j</span>:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-ink mb-3 pl-1">
            <li>
              <strong>If keys are mutually orthonormal:</strong> The inner products satisfy{' '}
              <span dangerouslySetInnerHTML={{ __html: mathEquation2 }} />. The cross-terms{' '}
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
    </div>
  );
};
