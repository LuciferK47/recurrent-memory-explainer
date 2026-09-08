import React from 'react';

interface FooterProps {
  onOpenCitations?: () => void;
  onOpenReadme?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenCitations, onOpenReadme }) => {
  const baseUrl = import.meta.env.BASE_URL || './';

  return (
    <footer className="border-t border-border/80 bg-surface/70 backdrop-blur-md py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-4 text-center">
        <p className="text-xs text-ink font-medium m-0">
          <strong className="text-memory">DataForge 2026 &times; Pathway Track</strong> &mdash; In-Context Learning with Recurrent Memory
        </p>
        <p className="text-xs text-ink-muted m-0 flex flex-wrap justify-center items-center gap-x-2 gap-y-1.5 font-mono">
          <a
            href="https://github.com/LuciferK47/recurrent-memory-explainer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:text-memory underline font-medium transition-colors inline-block py-1.5"
          >
            View Source (Team Repo)
          </a>
          <span className="text-ink-muted/50">&middot;</span>
          <a
            href="#readme"
            onClick={(e) => {
              if (onOpenReadme) {
                e.preventDefault();
                onOpenReadme();
              }
            }}
            className="text-ink hover:text-memory underline font-medium transition-colors inline-block py-1.5"
          >
            README
          </a>
          <span className="text-ink-muted/50">&middot;</span>
          <a
            href="#citations"
            onClick={(e) => {
              if (onOpenCitations) {
                e.preventDefault();
                onOpenCitations();
              }
            }}
            className="text-ink hover:text-memory underline font-medium transition-colors inline-block py-1.5"
          >
            Citations
          </a>
          <span className="text-ink-muted/50">&middot;</span>
          <a
            href={`${baseUrl}concept_summary.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-muted hover:text-memory underline transition-colors inline-block py-1.5"
          >
            Concept Summary (PDF)
          </a>
          <span className="text-ink-muted/50">&middot;</span>
          <a
            href="https://github.com/pathwaycom/bdh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-muted hover:text-memory underline transition-colors inline-block py-1.5"
          >
            Pathway's Reference Implementation (BDH)
          </a>
          <span className="text-[11px] text-ink-muted/70 font-sans">(official toy implementation, not this project's code)</span>
        </p>
        <p className="text-xs text-ink-muted m-0">
          Primary sources:{' '}
          <a href="https://arxiv.org/abs/2509.26507" target="_blank" rel="noopener noreferrer" className="text-memory hover:text-memory-dark underline inline-block py-1.5">
            arXiv:2509.26507
          </a>{' '}
          (BDH) &middot;{' '}
          <a href="https://arxiv.org/abs/2608.09888" target="_blank" rel="noopener noreferrer" className="text-memory hover:text-memory-dark underline inline-block py-1.5">
            arXiv:2608.09888
          </a>{' '}
          (BDH-CQ) &middot;{' '}
          <a href="https://arxiv.org/abs/2404.07143" target="_blank" rel="noopener noreferrer" className="text-memory hover:text-memory-dark underline inline-block py-1.5">
            arXiv:2404.07143
          </a>{' '}
          (Infini-attention) &middot;{' '}
          <a href="https://arxiv.org/abs/2501.00663" target="_blank" rel="noopener noreferrer" className="text-memory hover:text-memory-dark underline inline-block py-1.5">
            arXiv:2501.00663
          </a>{' '}
          (Titans)
        </p>
      </div>
    </footer>
  );
};
