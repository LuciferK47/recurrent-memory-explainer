/**
 * A requestAnimationFrame loop that idles when there's nothing to draw and
 * pauses immediately when told to (off-screen, tab hidden). `fn` returns
 * whether it needs another frame; if not, the loop parks with zero pending
 * rAF callbacks until something calls `request()` again.
 */
export interface FrameCtx {
  dt: number;
  now: number;
}

/** Return true to keep the loop running; false to let it park. */
export type FrameFn = (ctx: FrameCtx) => boolean;

export interface RafLoop {
  /** Wake the loop (idempotent — a no-op if a frame is already scheduled or the loop is inactive). */
  request(): void;
  /** External visibility gate — pause immediately, or resume and request a frame. */
  setActive(active: boolean): void;
  /** Tear down for good. Idempotent (safe to call twice, e.g. under StrictMode). */
  stop(): void;
}

export function createRafLoop(fn: FrameFn): RafLoop {
  let rafId: number | null = null;
  let active = true;
  let lastTime: number | null = null;

  function schedule() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  function tick(now: number) {
    rafId = null;
    const dt = lastTime === null ? 0 : Math.min(50, now - lastTime);
    lastTime = now;
    const stillAnimating = fn({ dt, now });
    if (stillAnimating && active) {
      schedule();
    } else {
      lastTime = null; // next wake starts clean with dt=0
    }
  }

  return {
    request() {
      if (active) schedule();
    },
    setActive(next) {
      active = next;
      if (!active) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        lastTime = null;
      } else {
        schedule();
      }
    },
    stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      active = false;
      lastTime = null;
    },
  };
}
