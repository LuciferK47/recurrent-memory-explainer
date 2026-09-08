/**
 * scenePosition -> StageLayout, continuous across scene boundaries.
 *
 * Each scene's `layoutFor` is a plain function of its own local progress in
 * [0,1]. Near a boundary, both the outgoing and incoming scene are evaluated
 * at their own (clamped) local progress and blended — the blend weight and
 * both operands are pure functions of the single global `scenePosition`
 * value, so the result is identical whether you arrive at the boundary from
 * below or above (no floor()-bucketing discontinuity), and it matches the
 * single-scene formula exactly at the blend window's edges by construction.
 */
import { SCENES, SceneId } from '../state/scene-spec';
import { StageLayout, lerpLayout } from '../lib/layout';
import { clamp01, smoothstep } from '../lib/easing';

const HALF_BAND = 0.075; // total morph band width 0.15, centered on each scene boundary

export interface ResolvedStage {
  layout: StageLayout;
  sceneIndex: number;
  sceneId: SceneId;
}

export function resolveStageLayout(scenePosition: number): ResolvedStage {
  const n = SCENES.length;
  const clamped = Math.max(0, Math.min(n - 1e-6, scenePosition));
  const idx = Math.min(n - 1, Math.floor(clamped));
  const localP = clamped - idx;
  const sceneId = SCENES[idx].id;

  if (idx < n - 1 && localP > 1 - HALF_BAND) {
    const boundary = idx + 1;
    const t = smoothstep((clamped - (boundary - HALF_BAND)) / (2 * HALF_BAND));
    const before = SCENES[idx].layoutFor(clamp01(clamped - idx));
    const after = SCENES[idx + 1].layoutFor(clamp01(clamped - boundary));
    return { layout: lerpLayout(before, after, t), sceneIndex: idx, sceneId };
  }
  if (idx > 0 && localP < HALF_BAND) {
    const boundary = idx;
    const t = smoothstep((clamped - (boundary - HALF_BAND)) / (2 * HALF_BAND));
    const before = SCENES[idx - 1].layoutFor(clamp01(clamped - (idx - 1)));
    const after = SCENES[idx].layoutFor(clamp01(clamped - boundary));
    return { layout: lerpLayout(before, after, t), sceneIndex: idx, sceneId };
  }

  return { layout: SCENES[idx].layoutFor(localP), sceneIndex: idx, sceneId };
}
