import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

export type PanelTone = 'memory' | 'truth' | 'interference' | 'synapse' | 'data';

interface PanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode;
  tone?: PanelTone;
  interactive?: boolean;
}

// Dark glass: a faint light bevel (not the 70%-white edge a light panel
// wanted — that would read as a neon rim here), and real black ambient
// shadows rather than ink-tinted ones — ink is now the light foreground
// text color, so an "ink shadow" would have been a light shadow, invisible
// as depth cueing on a dark page that needs actual darkness beneath a card
// to read as lifted.
const PANEL_SHADOW =
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.3),0_12px_24px_-12px_rgba(0,0,0,0.5),0_40px_70px_-32px_rgba(0,0,0,0.65)]';

/**
 * The one card/box treatment for the whole site — replaces the
 * `bg-surface/90 border border-border/80 rounded-xl ... shadow-md
 * backdrop-blur-sm` string that used to be hand-copied into every card
 * across MemoryLab, BDHModule, EvidencePanel, OpenQuestion, BreakingPoint,
 * CheckUnderstanding. Real glass now that the page has an illustrated
 * background behind it: a translucent fill, a faint inset bevel (what
 * makes a panel look lit from above rather than flat), and a layered dark
 * shadow for actual depth instead of a single flat drop-shadow.
 *
 * `tone` adds a thin top-edge accent gradient so panels stop reading
 * identically regardless of what they're about; `interactive` adds a
 * spring hover lift — plus a border that brightens to the tone hue, so
 * hover reads as "this card is alive" rather than only "this card moved."
 */
export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ tone, interactive = false, className = '', children, ...rest }, ref) => (
    <motion.div
      ref={ref}
      className={`relative rounded-3xl bg-surface/70 backdrop-blur-xl ring-1 ring-ink/[0.09] transition-shadow ${PANEL_SHADOW} ${
        interactive ? 'cursor-pointer hover:ring-memory/40' : ''
      } ${className}`}
      whileHover={interactive ? { y: -3 } : undefined}
      transition={interactive ? { type: 'spring', stiffness: 400, damping: 30 } : undefined}
      {...rest}
    >
      {tone && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px rounded-t-3xl pointer-events-none"
          style={{ background: `linear-gradient(to right, transparent, rgb(var(--color-${tone}) / 0.7), transparent)` }}
        />
      )}
      {children}
    </motion.div>
  )
);
Panel.displayName = 'Panel';
