import React from 'react';
import { motion } from 'motion/react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Scroll-triggered fade + rise entrance for section headers and cards
 * throughout the narrative column — the page had zero scroll-linked motion
 * below the hero before this. Plays once, the first time an element enters
 * the viewport. `MotionConfig reducedMotion="user"` (see App.tsx) already
 * snaps transform-based animations to their end state for reduced-motion
 * users app-wide, so this needs no separate guard.
 */
export const Reveal: React.FC<RevealProps> = ({ children, className, delay = 0 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.55, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each direct child's entrance, in seconds. */
  step?: number;
}

/**
 * A cascading version of Reveal for lists of similar items (card grids,
 * table rows) — each direct child fades+rises in turn rather than all at
 * once. Uses the same once-only viewport trigger and easing curve as
 * Reveal; children opt in individually via `staggerChild`'s `custom` index,
 * or simply render plain children and StaggerItem below.
 */
export const StaggerGroup: React.FC<StaggerGroupProps> = ({ children, className, step = 0.08 }) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    variants={{ hidden: {}, visible: { transition: { staggerChildren: step } } }}
  >
    {children}
  </motion.div>
);

/** One item inside a StaggerGroup — inherits the parent's stagger timing via variants propagation. */
export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div className={className} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.45, ease: EASE }}>
    {children}
  </motion.div>
);
