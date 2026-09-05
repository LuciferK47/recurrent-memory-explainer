import React from 'react';

export const OpenQuestion: React.FC = () => {
  return (
    <section className="py-12 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-display text-ink mb-3">The Open Question</h3>
          <p className="text-sm text-ink leading-relaxed mb-4">
            Can fixed-size recurrent memory <em>match</em> KV-cache recall fidelity on long-context tasks without resorting to hybrid approaches? The interference cliff you saw in Section 4 is the fundamental barrier. Gating, normalization, and selective writing can push it back — but they don't eliminate it.
          </p>
          <p className="text-xs text-ink-muted leading-relaxed m-0 border-t border-border pt-3">
            This remains an active area of research. See: Gated DeltaNet ({' '}
            <a
              href="https://arxiv.org/abs/2412.06464"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2412.06464
            </a>
            ), Variational Linear Attention ({' '}
            <a
              href="https://arxiv.org/abs/2412.09871"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2412.09871
            </a>
            ).
          </p>
        </div>
      </div>
    </section>
  );
};
