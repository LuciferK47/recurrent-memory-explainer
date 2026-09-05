import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-12 bg-surface border-t border-border text-center">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <p className="font-display text-lg text-ink mb-2">
          DataForge 2026 &times; Pathway Track — In-Context Learning with Recurrent Memory
        </p>
        <p className="text-xs text-ink-muted mb-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>Built with AI assistance. All content team-reviewed.</span>
          <span className="hidden sm:inline">&middot;</span>
          <a
            href="https://github.com/LuciferK47/recurrent-memory-explainer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:text-memory underline font-medium"
          >
            View Source (Team Repo)
          </a>
          <span>&middot;</span>
          <a
            href="/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:text-memory underline"
          >
            README
          </a>
          <span>&middot;</span>
          <a
            href="/docs/citations.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:text-memory underline"
          >
            Citations
          </a>
          <span>&middot;</span>
          <a
            href="/concept_summary.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:text-memory underline"
          >
            Concept Summary (PDF)
          </a>
          <span>&middot;</span>
          <a
            href="https://github.com/pathwaycom/bdh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:text-memory underline"
          >
            Pathway's Reference Implementation (BDH)
          </a>
          <span className="text-[11px] text-ink-muted">(official toy implementation, not this project's code)</span>
        </p>
        <p className="text-xs text-ink-muted m-0">
          Primary sources:{' '}
          <a href="https://arxiv.org/abs/2509.26507" target="_blank" rel="noopener noreferrer" className="hover:text-memory underline">
            arXiv:2509.26507
          </a>{' '}
          (BDH) &middot;{' '}
          <a href="https://arxiv.org/abs/2608.09888" target="_blank" rel="noopener noreferrer" className="hover:text-memory underline">
            arXiv:2608.09888
          </a>{' '}
          (BDH-CQ) &middot;{' '}
          <a href="https://arxiv.org/abs/2404.07143" target="_blank" rel="noopener noreferrer" className="hover:text-memory underline">
            arXiv:2404.07143
          </a>{' '}
          (Infini-attention) &middot;{' '}
          <a href="https://arxiv.org/abs/2501.00663" target="_blank" rel="noopener noreferrer" className="hover:text-memory underline">
            arXiv:2501.00663
          </a>{' '}
          (Titans)
        </p>
      </div>
    </footer>
  );
};
