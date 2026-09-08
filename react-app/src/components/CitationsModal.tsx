import React, { useEffect } from 'react';

/**
 * Renders docs/citations.md via public/citations.html — a standalone page
 * already prerendered with KaTeX and the app's typography (see
 * scripts/generate_readme_html.py). Previously this component baked the
 * entire markdown source as a template literal and re-parsed it at runtime
 * via `marked` + a KaTeX inline-math pass; that shipped ~7KB of duplicated
 * prose plus two whole libraries just to reproduce a page that already
 * exists on disk. An iframe reuses that page exactly, math and all — the
 * CDN <script> tags it loads itself run auto-render against its own
 * document, which a `fetch()`-and-inject approach can't reproduce (the raw
 * HTML on disk still has unrendered `$...$` delimiters until that script
 * runs against a real document).
 */

interface CitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CitationsModal: React.FC<CitationsModalProps> = ({ isOpen, onClose }) => {
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
      aria-labelledby="citations-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="instrument-panel bg-canvas border border-border rounded-xl shadow-2xl max-w-4xl w-full h-[88vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-memory/10 text-memory border border-memory/30 font-semibold">
              DOCUMENTATION
            </span>
            <h2 id="citations-title" className="text-lg font-display font-semibold text-ink m-0">
              Primary Citations & Literature
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
        <iframe src={`${baseUrl}citations.html`} title="Citations & Literature" className="flex-1 w-full border-0 bg-canvas" />

        {/* Footer Navigation Bar */}
        <div className="px-6 py-3 border-t border-border bg-surface flex items-center justify-between text-xs text-ink-muted">
          <span>
            Source:{' '}
            <code className="font-mono text-[11px] bg-linen px-1 py-0.5 rounded border border-border">docs/citations.md</code>
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
