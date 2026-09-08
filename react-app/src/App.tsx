import React, { useState, useEffect, Suspense, lazy } from 'react';
import { MotionConfig } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ScaleFreeBackground } from './components/ScaleFreeBackground';
import { Stage } from './stage/Stage';
import { CheckUnderstanding } from './components/CheckUnderstanding';
import { EvidencePanel } from './components/EvidencePanel';
import { OpenQuestion } from './components/OpenQuestion';
import { Footer } from './components/Footer';
import { WriteAnnouncer } from './components/WriteAnnouncer';
import { MemoryStoreProvider, useMemoryStore } from './state/memory-store';
import { randomUnitVector, createRng } from './lib/memory-math';
import { PRESET_LABELS } from './lib/preset-labels';

// Both modals are documentation viewers behind an explicit click (footer
// links, or a #citations/#readme deep link) — never needed for the initial
// render, so their code (plus each modal's own iframe-shell markup) only
// downloads once a reader actually opens one.
const CitationsModal = lazy(() => import('./components/CitationsModal').then(m => ({ default: m.CitationsModal })));
const ReadmeModal = lazy(() => import('./components/ReadmeModal').then(m => ({ default: m.ReadmeModal })));

const REVEAL_COUNT = 4;

export const App: React.FC = () => {
  const [showCitations, setShowCitations] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.hash === '#citations';
  });
  const [showReadme, setShowReadme] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.hash === '#readme';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#citations') {
        setShowCitations(true);
        setShowReadme(false);
      } else if (window.location.hash === '#readme') {
        setShowReadme(true);
        setShowCitations(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    // reducedMotion="user": CSS prefers-reduced-motion (index.css's blanket
    // animation-duration override) only touches CSS @keyframes/transitions —
    // it cannot reach motion/* components, which drive values via rAF/WAAPI
    // instead. This is the app-wide equivalent for every motion.* animation,
    // Hero's repeat: Infinity pulses included; MotionConfig snaps transform-
    // based animations (scale, x, y) to their end state automatically. Its
    // opacity-only loops still need an explicit check (see Hero.tsx) since
    // reduced-motion mode deliberately leaves plain fades alone.
    <MotionConfig reducedMotion="user">
      <MemoryStoreProvider initialDim={8}>
        <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-memory/20 relative">
          <ScaleFreeBackground />
          <Navbar />

          <main className="flex-1 relative z-10">
            <Hero />
            <Stage />
            <section className="py-6">
              <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <CheckUnderstanding />
              </div>
            </section>
            <EvidencePanel />
            <OpenQuestion />
          </main>

          <Footer
            onOpenCitations={() => setShowCitations(true)}
            onOpenReadme={() => setShowReadme(true)}
          />
          {/* Gated on the open flag, not just `isOpen`, so the lazy import()
              only fires the first time a reader actually opens one — an
              always-mounted-but-hidden lazy component would kick off its
              chunk download on first paint regardless. */}
          <Suspense
            fallback={
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <span className="text-ink-muted text-sm font-mono">Loading…</span>
              </div>
            }
          >
            {showCitations && (
              <CitationsModal
                isOpen
                onClose={() => {
                  setShowCitations(false);
                  if (window.location.hash === '#citations') {
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                  }
                }}
              />
            )}
            {showReadme && (
              <ReadmeModal
                isOpen
                onClose={() => {
                  setShowReadme(false);
                  if (window.location.hash === '#readme') {
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                  }
                }}
              />
            )}
          </Suspense>
          <HeroReveal />
          <WriteAnnouncer />
        </div>
      </MemoryStoreProvider>
    </MotionConfig>
  );
};

/**
 * Staged hero-load reveal: populates the store with a few preset pairs on
 * mount so the page opens with the matrix already alive, never a blank
 * canvas. Renders nothing — it only needs `useMemoryStore()`, which requires
 * being inside `<MemoryStoreProvider>`, hence the separate component.
 */
const HeroReveal: React.FC = () => {
  const store = useMemoryStore();

  useEffect(() => {
    const rng = createRng(42);
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < REVEAL_COUNT; i++) {
      const t = setTimeout(() => {
        const k = randomUnitVector(8, rng);
        const v = randomUnitVector(8, rng);
        store.addPair(k, v, PRESET_LABELS[i]);
      }, i * 140);
      timeouts.push(t);
    }
    return () => timeouts.forEach(clearTimeout);
    // Runs once on mount against the store instance this Provider created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
