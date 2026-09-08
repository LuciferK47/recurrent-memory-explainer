import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Tier-1 "Apple-glassy" icon: a squircle of layered translucency over the
 * active palette's accent color, with an inner top highlight and a soft
 * ambient glow. Reads the same CSS custom properties as every Tailwind
 * color token (see index.css), so it re-tints correctly whether it sits on
 * the paper page or inside an `.instrument-panel` — no theme prop needed.
 *
 * This is deliberately the ONLY place besides the isometric illustration
 * suite that carries real visual weight — everything else is flat, quiet
 * prose. Use it for section eyebrows, evidence-level badges, and control
 * affordances; never as a substitute for a plain inline icon in body text.
 */
export type GlassTone = 'memory' | 'truth' | 'interference' | 'synapse' | 'data' | 'ink';

const TONE_VAR: Record<GlassTone, string> = {
  memory: '--color-memory',
  truth: '--color-truth',
  interference: '--color-interference',
  synapse: '--color-synapse',
  data: '--color-data',
  ink: '--color-ink',
};

interface GlassIconProps {
  icon: LucideIcon;
  tone?: GlassTone;
  size?: number;
  iconSize?: number;
  className?: string;
}

export const GlassIcon: React.FC<GlassIconProps> = ({ icon: Icon, tone = 'memory', size = 36, iconSize, className }) => {
  const v = TONE_VAR[tone];
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        background: `rgb(var(${v}) / 0.16)`,
        border: `1px solid rgb(var(${v}) / 0.32)`,
        // A fixed dark ambient shadow, not derived from --color-ink — ink is
        // the page's light foreground text color, so deriving from it here
        // would mean "shadow" and "text" flip together, when this shadow
        // should always read as depth beneath the glass regardless of theme.
        boxShadow: `0 1px 2px rgba(0,0,0,0.35), 0 0 16px -6px rgb(var(${v}) / 0.5)`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgb(255 255 255 / 0.2), rgb(255 255 255 / 0))' }}
      />
      <Icon size={iconSize ?? Math.round(size * 0.52)} strokeWidth={2} style={{ color: `rgb(var(${v}))`, position: 'relative', zIndex: 1 }} />
    </span>
  );
};
