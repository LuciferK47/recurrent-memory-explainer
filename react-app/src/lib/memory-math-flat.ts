/**
 * memory-math-flat.ts — Float32Array hot-path variants of memory-math.ts.
 *
 * memory-math.ts's `Matrix = number[][]` + `cloneMatrix` is the right shape
 * for the pure, documented substrate (README and in-app footnotes point at
 * it by name) — but it allocates d+1 arrays per write and is the wrong shape
 * for a 60fps render loop. These flat, row-major, in-place variants exist
 * purely for that hot path (the memory-store's `display` channel and the
 * Stage canvas renderer); they are mathematically identical to their
 * memory-math.ts counterparts and never change the pure API's signatures.
 */

import { Vector } from './memory-math';

/** Row-major flat matrix: M[i][j] lives at flat[i * dim + j]. */
export function createZeroMatrixFlat(dim: number): Float32Array {
  return new Float32Array(dim * dim);
}

export function toFlat(M: number[][]): Float32Array {
  const dim = M.length;
  const flat = new Float32Array(dim * dim);
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) flat[i * dim + j] = M[i][j];
  }
  return flat;
}

export function fromFlat(flat: Float32Array, dim: number): number[][] {
  const M: number[][] = [];
  for (let i = 0; i < dim; i++) {
    const row = new Array(dim);
    for (let j = 0; j < dim; j++) row[j] = flat[i * dim + j];
    M.push(row);
  }
  return M;
}

/** In-place M <- M + v * k^T. Mutates `M`; returns nothing. */
export function writeAssociationInto(M: Float32Array, dim: number, k: Vector, v: Vector): void {
  for (let i = 0; i < dim; i++) {
    const vi = v[i];
    const rowOff = i * dim;
    for (let j = 0; j < dim; j++) {
      M[rowOff + j] += vi * k[j];
    }
  }
}

/**
 * In-place M <- (1 - lambda) * M + eta * v * k^T. Mutates `M`; returns
 * nothing. Flat mirror of memory-math.ts's writeWithDecay, mathematically
 * identical to writeAssociationInto at eta=1, lambda=0 (every existing
 * caller's default) — the store uses this exclusively so eta/lambda are a
 * genuine part of the one write path, not a decorative branch.
 */
export function writeWithDecayInto(M: Float32Array, dim: number, k: Vector, v: Vector, eta: number, lambda: number): void {
  const keep = 1 - lambda;
  for (let i = 0; i < dim; i++) {
    const vi = v[i];
    const rowOff = i * dim;
    for (let j = 0; j < dim; j++) {
      const idx = rowOff + j;
      M[idx] = keep * M[idx] + eta * vi * k[j];
    }
  }
}

/** In-place v_hat <- M * q, written into `out` (must be length `dim`). */
export function readAssociationInto(M: Float32Array, dim: number, q: Vector, out: Float32Array): void {
  for (let i = 0; i < dim; i++) {
    let sum = 0;
    const rowOff = i * dim;
    for (let j = 0; j < dim; j++) sum += M[rowOff + j] * q[j];
    out[i] = sum;
  }
}

/** Max absolute cell value, for heatmap color normalization. */
export function maxAbsFlat(M: Float32Array): number {
  let m = 0;
  for (let i = 0; i < M.length; i++) {
    const a = Math.abs(M[i]);
    if (a > m) m = a;
  }
  return m < 1e-6 ? 1 : m;
}

/** Largest absolute difference between two same-length flat matrices — the convergence test for the interpolation loop. */
export function maxAbsDiff(a: Float32Array, b: Float32Array): number {
  let m = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    if (d > m) m = d;
  }
  return m;
}

/** Cosine similarity where one operand is a flat readout buffer. */
export function cosineSimilarityFlat(a: Float32Array, b: Vector): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (normA < 1e-10 || normB < 1e-10) return 0;
  return dot / (normA * normB);
}

/** Mean cosine-similarity recall across every stored pair, against a flat matrix snapshot. Shared by Breaking Point's precomputed-vs-live framing and the Stage's cliff-scene history. */
export function meanRecallFlat(matrixFlat: Float32Array, dim: number, pairs: readonly { key: Vector; value: Vector }[]): number {
  if (pairs.length === 0) return 1.0;
  const readout = new Float32Array(dim);
  let sum = 0;
  for (const p of pairs) {
    readAssociationInto(matrixFlat, dim, p.key, readout);
    sum += cosineSimilarityFlat(readout, p.value);
  }
  return sum / pairs.length;
}
