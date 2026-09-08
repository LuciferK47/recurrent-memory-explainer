/**
 * Scroll position -> {scene, continuous scenePosition}, via motion's scroll
 * engine rather than a hand-rolled scroll listener or IntersectionObserver.
 *
 * Rejected alternatives (see the design plan): IntersectionObserver's
 * intersectionRatio saturates at 1.0 across a full-viewport section — a dead
 * zone exactly where progress resolution matters most. A raw `scroll`
 * listener (the pattern already in Navbar.tsx) does `offsetTop`/`offsetHeight`
 * reads per event — a forced-layout on the scroll path. `useScroll` batches
 * all measurement into one `frame.read` pass and re-measures via
 * ResizeObserver.
 *
 * `scenePosition` is a MotionValue (Tier 2 — 60Hz, zero React renders);
 * `sceneIndex`/`sceneId` are committed to React state only across a
 * hysteresis deadband, so parking exactly on a scene boundary can't thrash.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useScroll, useTransform, useMotionValueEvent, MotionValue } from 'motion/react';
import { SCENES, SCENE_BOUNDS, SceneId } from '../state/scene-spec';

export interface SceneFrame {
  sceneIndex: number;
  sceneId: SceneId;
  sceneProgress: number; // 0..1 within the committed scene
  scenePosition: number; // continuous: 1.63 == 63% through scene index 1
  globalProgress: number; // 0..1 across the whole track
  direction: 1 | -1;
}

export interface ScrollScene {
  scene: SceneId;
  sceneIndex: number;
  trackRef: React.RefObject<HTMLDivElement | null>;
  /** MotionValue — bind directly to motion.* style, or read via frameRef in the render loop. Never touches React state. */
  scenePosition: MotionValue<number>;
  /** Mutable snapshot the rAF loop reads with no subscription. */
  frameRef: React.MutableRefObject<SceneFrame>;
  /** Register a "scroll moved" wake callback (e.g. loop.request()). Returns an unsubscribe. */
  onFrame: (fn: () => void) => () => void;
  scrollToScene: (id: SceneId, behavior?: ScrollBehavior) => void;
}

const HYSTERESIS = 0.06;

export function useScrollScene(): ScrollScene {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });

  // Piecewise-linear remap through each scene's weighted share of the track,
  // so scenePosition's integer part is the scene index and its fractional
  // part is that scene's own local progress, regardless of relative weight.
  const breakpoints = useMemo(() => SCENES.map((_, i) => i).concat([SCENES.length]), []);
  const scenePosition = useTransform(scrollYProgress, SCENE_BOUNDS as number[], breakpoints);

  const [sceneIndex, setSceneIndex] = useState(0);
  const committedRef = useRef(0);
  const listenersRef = useRef(new Set<() => void>());
  const frameRef = useRef<SceneFrame>({
    sceneIndex: 0,
    sceneId: SCENES[0].id,
    sceneProgress: 0,
    scenePosition: 0,
    globalProgress: 0,
    direction: 1,
  });

  useMotionValueEvent(scenePosition, 'change', pos => {
    const idx = Math.min(SCENES.length - 1, Math.max(0, Math.floor(pos)));
    const p = Math.max(0, Math.min(1, pos - idx));
    const committed = committedRef.current;

    if (idx > committed && p > HYSTERESIS) {
      committedRef.current = idx;
      setSceneIndex(idx);
    } else if (idx < committed && p < 1 - HYSTERESIS) {
      committedRef.current = idx;
      setSceneIndex(idx);
    }

    const prevPos = frameRef.current.scenePosition;
    frameRef.current = {
      sceneIndex: idx,
      sceneId: SCENES[idx].id,
      sceneProgress: p,
      scenePosition: pos,
      globalProgress: scrollYProgress.get(),
      direction: pos >= prevPos ? 1 : -1,
    };
    listenersRef.current.forEach(fn => fn());
  });

  const onFrame = useCallback((fn: () => void) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  const scrollToScene = useCallback((id: SceneId, behavior: ScrollBehavior = 'smooth') => {
    const track = trackRef.current;
    if (!track) return;
    const i = SCENES.findIndex(s => s.id === id);
    if (i < 0) return;
    const rect = track.getBoundingClientRect();
    const trackTop = window.scrollY + rect.top;
    const scrollable = Math.max(0, track.offsetHeight - window.innerHeight);
    // The *middle* of the scene's range, not its start boundary: landing
    // exactly at SCENE_BOUNDS[i] gives a raw scenePosition of i.0 (p=0),
    // which sits inside the HYSTERESIS deadband above and never commits —
    // the display stays stuck on the previous scene until the reader
    // scrolls further. Centering the target guarantees clearing that
    // deadband on entry, with room before the next boundary too.
    const midProgress = (SCENE_BOUNDS[i] + SCENE_BOUNDS[i + 1]) / 2;
    window.scrollTo({ top: trackTop + midProgress * scrollable, behavior });
  }, []);

  return {
    scene: SCENES[sceneIndex].id,
    sceneIndex,
    trackRef,
    scenePosition,
    frameRef,
    onFrame,
    scrollToScene,
  };
}
