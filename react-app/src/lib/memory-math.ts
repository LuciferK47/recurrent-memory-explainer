/**
 * memory-math.ts — Framework-Agnostic Core Mathematical Substrate
 *
 * Pure functions only. Zero DOM references.
 * Implements the exact outer-product Hebbian write and linear readout mechanism:
 *   Write: M <- M + v * k^T
 *   Read:  v_hat = M * q
 *
 * This substrate is identical in mathematical definition to Section 3 of BDH
 * (arXiv:2509.26507) and Section 3 of BDH-CQ (arXiv:2608.09888).
 */

export type Matrix = number[][];
export type Vector = number[];

/**
 * Create a dim x dim zero matrix.
 */
export function createZeroMatrix(dim: number): Matrix {
  return Array.from({ length: dim }, () => new Array(dim).fill(0));
}

/**
 * Clone a 2D matrix.
 */
export function cloneMatrix(M: Matrix): Matrix {
  return M.map(row => [...row]);
}

/**
 * Hebbian outer-product write: M <- M + v * k^T
 * Pure function: returns a new updated matrix without mutating the input.
 *
 * @param M Current memory matrix (dim x dim)
 * @param k Key vector (dim)
 * @param v Value vector (dim)
 * @returns Updated memory matrix
 */
export function writeAssociation(M: Matrix, k: Vector, v: Vector): Matrix {
  const dim = M.length;
  const newM = cloneMatrix(M);
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      newM[i][j] += v[i] * k[j];
    }
  }
  return newM;
}

/**
 * Linear readout: v_hat = M * q
 *
 * @param M Memory matrix (dim x dim)
 * @param q Query vector (dim)
 * @returns Retrieved value vector (dim)
 */
export function readAssociation(M: Matrix, q: Vector): Vector {
  const dim = M.length;
  const result = new Array(dim).fill(0);
  for (let i = 0; i < dim; i++) {
    let sum = 0;
    for (let j = 0; j < dim; j++) {
      sum += M[i][j] * q[j];
    }
    result[i] = sum;
  }
  return result;
}

/**
 * Cosine similarity between two vectors in [-1, 1].
 */
export function cosineSimilarity(a: Vector, b: Vector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
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

/**
 * Seeded pseudo-random number generator (Mulberry32).
 */
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a random unit vector of dimension d using Box-Muller transform.
 */
export function randomUnitVector(dim: number, rng: () => number = Math.random): Vector {
  const v = new Array(dim);
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    const u1 = Math.max(1e-12, rng());
    const u2 = rng();
    const val = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    v[i] = val;
    norm += val * val;
  }
  norm = Math.sqrt(norm);
  for (let i = 0; i < dim; i++) {
    v[i] /= norm;
  }
  return v;
}

/**
 * Run a full interference trial for a given dimension and number of stored pairs.
 * Used by the live "Flood" experiment and precomputation verification.
 *
 * @param dim Memory dimension d
 * @param nPairs Number of pairs to inject
 * @param seed Optional seed for reproducibility
 * @returns { meanRecall: number, recalls: number[] }
 */
export function runInterferenceTrial(
  dim: number,
  nPairs: number,
  seed?: number
): { meanRecall: number; recalls: number[] } {
  const rng = seed !== undefined ? createRng(seed) : Math.random;
  let M = createZeroMatrix(dim);
  const keys: Vector[] = [];
  const values: Vector[] = [];

  // Write all pairs
  for (let p = 0; p < nPairs; p++) {
    const k = randomUnitVector(dim, rng);
    const v = randomUnitVector(dim, rng);
    keys.push(k);
    values.push(v);
    M = writeAssociation(M, k, v);
  }

  // Read all pairs and calculate cosine similarities
  const recalls: number[] = [];
  let sum = 0;
  for (let p = 0; p < nPairs; p++) {
    const retrieved = readAssociation(M, keys[p]);
    const sim = cosineSimilarity(retrieved, values[p]);
    recalls.push(sim);
    sum += sim;
  }

  const meanRecall = nPairs > 0 ? sum / nPairs : 1.0;
  return { meanRecall, recalls };
}

/**
 * Compute vector dot product: a^T * b
 */
export function vectorDot(a: Vector, b: Vector): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Generate a deterministic unit vector from a text string.
 */
export function vectorFromText(text: string, dim: number): Vector {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const rng = createRng(Math.abs(hash) + 1337);
  return randomUnitVector(dim, rng);
}

