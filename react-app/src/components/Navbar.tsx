import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

export const Navbar: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  // Whole-page scroll progress — smoothed with a spring so it doesn't
  // visibly step on a low-refresh-rate trackpad scroll.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 300, damping: 40, mass: 0.2 });

  useEffect(() => {
    const sections = ['hero', 'problem', 'memory', 'bdh', 'interference', 'evidence'];
    const handleScroll = () => {
      const scrollY = window.scrollY + 200;
      for (const s of sections) {
        const el = document.getElementById(s);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveSection(s);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'hero', label: 'Overview' },
    { id: 'problem', label: '01 The Problem' },
    { id: 'memory', label: '02 Memory Lab' },
    { id: 'bdh', label: '03 BDH Module' },
    { id: 'interference', label: '04 Breaking Point' },
    { id: 'evidence', label: '05 Evidence' },
  ];

  return (
    <>
      {/* Whole-page scroll progress — a thin fixed bar above the floating
          nav pill, distinct from it so it reads at a glance from any
          scroll position without competing with the pill's own content. */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[2px] bg-memory z-50 origin-left"
        style={{ scaleX: progress }}
      />
      <nav className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-surface/80 backdrop-blur-xl border border-border/80 rounded-full shadow-sm px-3 sm:px-4 py-1.5 max-w-[95vw] overflow-x-auto">
      <div className="flex items-center gap-2 pr-2 border-r border-border shrink-0">
        <span className="w-2 h-2 rounded-full bg-truth" />
        <span className="text-xs font-medium text-ink hidden sm:inline">DataForge 2026 &times; Pathway</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {navItems.map(item => {
          const isActive = activeSection === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveSection(item.id)}
              className="relative text-xs px-2.5 sm:px-3 py-1.5 rounded-full font-medium transition-colors text-ink-muted hover:text-ink select-none"
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavHighlight"
                  className="absolute inset-0 bg-surface-elevated rounded-full shadow-[0_0_15px_rgba(0,210,255,0.15)] border border-memory/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? 'text-white font-semibold text-shadow-sm' : 'text-ink-muted hover:text-ink'}`}>
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
    </>
  );
};
