/**
 * The outer-product write animation: M <- M + v k^T, made visible.
 *
 * Timing (940ms total, same regardless of dimension d — see BEAM_STAGGER_BUDGET):
 *   arrive     0-180ms   v/k^T gutter swatches slide into place
 *   charge     180-300ms bars grow to |v[i]|, |k[j]|
 *   beam       300-700ms row/column beams sweep across; a cell (i,j) "fires"
 *              the instant its row's rightward beam AND its column's
 *              downward beam have both reached it
 *   accumulate 220ms per cell, latched from that cell's own fire time — the
 *              corner cell (last to fire, ~700ms) finishes around 920ms
 *   settle     700-940ms beam overlay fades; gutters drop to a dim
 *              "last write" legend
 *
 * Critical timing decision: BEAM_STAGGER_BUDGET is a fixed total (120ms)
 * divided across d rows/columns, not a fixed per-index delay — so the whole
 * sequence takes the same wall-clock time at d=4 and d=32, satisfying the
 * "controls respond in under a second" rule at every dimension. A fixed
 * per-index delay (e.g. 8ms * i) would stretch to 250ms of stagger alone at
 * d=32.
 *
 * A batch of N new pairs (e.g. "+5 Pairs") gives the FIRST pair the full
 * show above; the remaining N-1 are summed into one combined delta that
 * fades in over EXTRA_FADE_DUR starting mid-sequence, so a 5-pair batch
 * still finishes within one TOTAL_MS window rather than playing 5 full
 * sequences back to back.
 */
import { Vector } from '../../lib/memory-math';
import { clamp01, easeInOutCubic, easeOutQuad } from '../../lib/easing';

export const TOTAL_MS = 940;
export const T_ARRIVE = 180;
export const T_CHARGE = 300; // == beam phase start
export const BEAM_STAGGER_BUDGET = 120;
export const BEAM_DUR = 280;
export const T_BEAM_END = T_CHARGE + BEAM_STAGGER_BUDGET + BEAM_DUR; // 700
export const CELL_RAMP = 220;
export const EXTRA_FADE_START = 400;
export const EXTRA_FADE_DUR = 360;

export interface WritePair {
  key: Vector;
  value: Vector;
}

export interface WriteAnim {
  dim: number;
  t0: number;
  speed: number;
  base: Float32Array;
  primaryDelta: Float32Array;
  extraDelta: Float32Array;
  vAbs: Float32Array;
  kAbs: Float32Array;
  vSign: Float32Array;
  kSign: Float32Array;
  fireT: Float32Array;
  hasExtra: boolean;
}

export function startWrite(baseFlat: Float32Array, dim: number, pairs: readonly WritePair[], now: number, speed = 1): WriteAnim {
  const primary = pairs[0];
  const primaryDelta = new Float32Array(dim * dim);
  for (let i = 0; i < dim; i++) {
    const vi = primary.value[i];
    for (let j = 0; j < dim; j++) primaryDelta[i * dim + j] = vi * primary.key[j];
  }

  const extraDelta = new Float32Array(dim * dim);
  for (let p = 1; p < pairs.length; p++) {
    const { key, value } = pairs[p];
    for (let i = 0; i < dim; i++) {
      const vi = value[i];
      for (let j = 0; j < dim; j++) extraDelta[i * dim + j] += vi * key[j];
    }
  }

  const vAbs = new Float32Array(dim);
  const kAbs = new Float32Array(dim);
  const vSign = new Float32Array(dim);
  const kSign = new Float32Array(dim);
  let vMax = 1e-6;
  let kMax = 1e-6;
  for (let i = 0; i < dim; i++) vMax = Math.max(vMax, Math.abs(primary.value[i]));
  for (let j = 0; j < dim; j++) kMax = Math.max(kMax, Math.abs(primary.key[j]));
  for (let i = 0; i < dim; i++) {
    vAbs[i] = Math.abs(primary.value[i]) / vMax;
    vSign[i] = Math.sign(primary.value[i]);
  }
  for (let j = 0; j < dim; j++) {
    kAbs[j] = Math.abs(primary.key[j]) / kMax;
    kSign[j] = Math.sign(primary.key[j]);
  }

  return {
    dim,
    t0: now,
    speed,
    base: new Float32Array(baseFlat),
    primaryDelta,
    extraDelta,
    vAbs,
    kAbs,
    vSign,
    kSign,
    fireT: new Float32Array(dim * dim).fill(-1),
    hasExtra: pairs.length > 1,
  };
}

/** Fill `out` with the matrix as of `now`. Returns true if still animating (caller should keep sampling). */
export function sampleWrite(anim: WriteAnim, now: number, out: Float32Array): boolean {
  const { dim, t0, speed, base, primaryDelta, extraDelta, fireT } = anim;
  const t = (now - t0) * speed;
  const stagger = BEAM_STAGGER_BUDGET / Math.max(1, dim - 1);
  const extraU = anim.hasExtra ? easeOutQuad(clamp01((t - EXTRA_FADE_START) / EXTRA_FADE_DUR)) : 0;

  for (let i = 0; i < dim; i++) {
    const hProgress = easeInOutCubic(clamp01((t - T_CHARGE - i * stagger) / BEAM_DUR));
    const rowOff = i * dim;
    for (let j = 0; j < dim; j++) {
      const vProgress = easeInOutCubic(clamp01((t - T_CHARGE - j * stagger) / BEAM_DUR));
      const idx = rowOff + j;
      if (fireT[idx] < 0 && hProgress >= (j + 0.5) / dim && vProgress >= (i + 0.5) / dim) {
        fireT[idx] = t;
      }
      const u = fireT[idx] < 0 ? 0 : clamp01((t - fireT[idx]) / CELL_RAMP);
      let val = base[idx] + primaryDelta[idx] * easeOutQuad(u);
      if (anim.hasExtra) val += extraDelta[idx] * extraU;
      out[idx] = val;
    }
  }

  return t < TOTAL_MS;
}
