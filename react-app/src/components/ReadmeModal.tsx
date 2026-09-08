import React, { useEffect } from 'react';

/**
 * Renders README.md via public/readme.html — see CitationsModal.tsx's
 * comment for why this is an iframe onto a prerendered page rather than a
 * baked markdown string re-parsed at runtime with `marked` + KaTeX.
 */

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const baseUrl = import.meta.env.BASE_URL || './';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="readme-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="instrument-panel bg-canvas border border-border rounded-xl shadow-2xl max-w-4xl w-full h-[88vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-truth/10 text-truth border border-truth/30 font-semibold">
              DOCUMENTATION
            </span>
            <h2 id="readme-title" className="text-lg font-display font-semibold text-ink m-0">
              Project README & Overview
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-border/40 text-ink-muted hover:text-ink transition-colors font-mono text-xs flex items-center gap-1"
            aria-label="Close modal"
          >
            <span className="text-base leading-none">&times;</span>
            <span className="hidden sm:inline">Close (Esc)</span>
          </button>
        </div>

        {/* Prerendered content, loaded as a real document so its own KaTeX auto-render script runs */}
        <iframe src={`${baseUrl}readme.html`} title="Project README & Overview" className="flex-1 w-full border-0 bg-canvas" />

        {/* Footer Navigation Bar */}
        <div className="px-6 py-3 border-t border-border bg-surface flex items-center justify-between text-xs text-ink-muted">
          <span>
            Source: <code className="font-mono text-[11px] bg-linen px-1 py-0.5 rounded border border-border">README.md</code>
          </span>
          <div className="flex gap-4">
            <a
              href="https://github.com/LuciferK47/recurrent-memory-explainer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              GitHub Repository
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-ink text-canvas hover:opacity-90 font-medium transition-opacity"
            >
              Back to Explainer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
