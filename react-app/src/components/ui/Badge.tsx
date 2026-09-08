import React from 'react';

export type BadgeTone = 'deployed' | 'precomputed' | 'self-reported' | 'audited' | 'illustration' | 'neutral';

// Literal class strings, not `bg-${tone}/10` — Tailwind's build-time scanner
// can't see template-interpolated class names (the same pitfall documented
// on CheckUnderstanding.tsx's verdictClasses and EvidencePanel's
// evidenceToneClasses, both fixed the same way).
const toneClasses: Record<BadgeTone, string> = {
  deployed: 'bg-truth/10 text-truth border-truth/30',
  precomputed: 'bg-data/10 text-data border-data/30',
  'self-reported': 'bg-ink-muted/10 text-ink-muted border-border/80',
  audited: 'bg-data/10 text-data border-data/30',
  illustration: 'bg-synapse/10 text-synapse border-synapse/30',
  neutral: 'bg-surface-elevated text-ink-muted border-border/80',
};

/** The evidence/provenance pill — was hand-rolled in ≥5 places (EvidencePanel,
 * BDHModule, BreakingPoint), always rendered the same flat grey regardless
 * of what it actually claimed. Tone-mapped now, so "deployed" reads
 * differently from "self-reported benchmark" at a glance, not just in text. */
export const Badge: React.FC<{ tone?: BadgeTone; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  children,
  className = '',
}) => (
  <span
    className={`inline-block text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full border whitespace-nowrap ${toneClasses[tone]} ${className}`}
  >
    {children}
  </span>
);
