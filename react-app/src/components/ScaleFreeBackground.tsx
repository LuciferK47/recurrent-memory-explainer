import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useScroll, useTransform } from 'motion/react';
import { useMemoryStore } from '../state/memory-store';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { IsoCity, type CityEvent } from './background/IsoCity';
import { generateCityData } from './background/city-data';
import { INK, MEMORY, TRUTH, SYNAPSE, DATA, hex } from '../stage/render/theme';

/** Full-bleed isometric circuit-city background coupled to the shared memory store. */

const PALETTE = {
  // Dedicated dark building material — not the theme's `ink` (now light
  // text), see IsoCity.tsx's Palette doc comment for why that distinction
  // matters post dark-flip.
  structure: '#16262F',
  ink: hex(INK),
  memory: hex(MEMORY),
  truth: hex(TRUTH),
  synapse: hex(SYNAPSE),
  data: hex(DATA),
};

const MAX_CONCURRENT_EVENTS = 3;
const EVENT_LIFETIME_MS = 1400;

// A single 200x200 fractal-noise tile, tiled across the page — the classic
// "expensive site" film-grain texture. One inline data: URI, generated
// once; no per-frame cost, no network request.
const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export const ScaleFreeBackground: React.FC = () => {
  const store = useMemoryStore();
  const reducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  const yFar = useTransform(scrollY, v => v * 0.02);
  const yMid = useTransform(scrollY, v => v * 0.05);
  const yNear = useTransform(scrollY, v => v * 0.09);

  const cityData = useMemo(() => generateCityData(), []);

  const [events, setEvents] = useState<CityEvent[]>([]);
  const eventIdRef = useRef(0);
  const prevLenRef = useRef(0);

  useEffect(() => {
    prevLenRef.current = store.getSnapshot().pairs.length;
    if (reducedMotion) return;
    return store.subscribe(() => {
      const snap = store.getSnapshot();
      if (snap.pairs.length > prevLenRef.current) {
        const id = eventIdRef.current++;
        setEvents(prev => [...prev.slice(-(MAX_CONCURRENT_EVENTS - 1)), { id }]);
        window.setTimeout(() => setEvents(prev => prev.filter(e => e.id !== id)), EVENT_LIFETIME_MS);
      }
      prevLenRef.current = snap.pairs.length;
    });
  }, [store, reducedMotion]);

  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-canvas">
      {/* Layer 1: the blurred reference plate — atmospheric colour only.
          public/bg-plate.webp is generated from the reference photo via:
            magick ref.jpeg -resize 640x -modulate 55,70,100 -blur 0x28
                   -fill "#08161B" -colorize 25% -quality 78 bg-plate.webp
          The heavy blur (a) destroys legibility of the source image's own
          baked-in text entirely and (b) means the source's modest
          resolution never matters — a blurred plate needs no resolution. */}
      <img
        src={`${import.meta.env.BASE_URL}bg-plate.webp`}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />

      {/* Layer 2: aurora — 3 large soft glows on a slow independent drift,
          pure CSS so they cost nothing per frame. Static under reduced
          motion (the animation-name is simply never applied). */}
      <div className="absolute inset-0">
        <div
          className={`absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full opacity-40 ${
            reducedMotion ? '' : 'animate-aurora-a'
          }`}
          style={{ background: 'radial-gradient(circle, rgba(0,210,255,0.35), transparent 65%)', filter: 'blur(80px)' }}
        />
        <div
          className={`absolute top-[20%] -right-[15%] w-[50vw] h-[50vw] rounded-full opacity-35 ${
            reducedMotion ? '' : 'animate-aurora-b'
          }`}
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.32), transparent 65%)', filter: 'blur(90px)' }}
        />
        <div
          className={`absolute bottom-[-15%] left-[25%] w-[45vw] h-[45vw] rounded-full opacity-30 ${
            reducedMotion ? '' : 'animate-aurora-c'
          }`}
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.28), transparent 65%)', filter: 'blur(85px)' }}
        />
      </div>

      {/* Layer 3: fine technical grid. */}
      <div className="absolute inset-0 bg-grid-pattern" />

      {/* Layer 4: the coded city — full-bleed and dense, the actual subject
          of the reference rather than a marginal accent. No text-column
          mask: dark panels over a dark scene stay legible on their own
          opacity, the way the reference's own glass cards do. */}
      <IsoCity
        palette={PALETTE}
        cityData={cityData}
        events={events}
        reducedMotion={reducedMotion}
        yFar={yFar}
        yMid={yMid}
        yNear={yNear}
      />

      {/* Layer 5: film grain — a static tiled fractal-noise texture, the
          single biggest "expensive site" tell on both reference sites. */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN_SVG}")`, backgroundSize: '200px 200px' }}
      />

      {/* Layer 6: a gentle top/bottom vignette so the field settles under
          the fixed navbar and above the footer rather than cutting hard. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgb(var(--color-canvas) / 0.65) 0%, transparent 12%, transparent 88%, rgb(var(--color-canvas) / 0.5) 100%)',
        }}
      />
    </div>
  );
};
