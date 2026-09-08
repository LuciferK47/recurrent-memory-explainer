import React from 'react';
import { motion } from 'motion/react';
import { Reveal } from './Reveal';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  lede?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * The numbered-eyebrow + title header repeated at the top of every major
 * section — Stage's four scenes, Evidence — previously each hand-rolled
 * with slightly different markup (a plain `text-sm font-display` eyebrow,
 * no rule). The hairline rule scales in from the eyebrow outward the first
 * time the header enters view — one more small scroll-triggered beat
 * alongside Reveal's fade+rise, same once-only viewport trigger and easing.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ eyebrow, title, lede, icon, className = '' }) => (
  <Reveal className={`flex items-start gap-6 ${className}`}>
    {icon}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-ink-muted shrink-0 font-semibold">
          {eyebrow}
        </span>
        <motion.span
          aria-hidden="true"
          className="h-px flex-1 bg-border/70 origin-left"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <h2 className="text-3xl sm:text-4xl font-display text-ink mb-3">{title}</h2>
      {lede && <p className="text-base text-ink-muted max-w-2xl leading-relaxed m-0">{lede}</p>}
    </div>
  </Reveal>
);
