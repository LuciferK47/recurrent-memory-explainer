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

/**
 * Construct a unit vector at an exact angle theta (radians) from a reference
 * key, via Gram-Schmidt: sample a random vector, orthogonalize it against
 * kRef to get a unit vector p perpendicular to kRef, then blend
 * cos(theta)*kRef + sin(theta)*p. At theta=0 this returns (a copy of) kRef;
 * at theta=pi/2 it returns a vector exactly orthogonal to kRef.
 *
 * Powers the orthogonality-angle control: the one slider that drives the
 * cross-talk term k_i^T k_j directly, rather than sampling it indirectly
 * through random re-draws.
 */
export function makeKeyAtAngle(kRef: Vector, theta: number, rng: () => number = Math.random): Vector {
  const dim = kRef.length;
  const raw = randomUnitVector(dim, rng);
  const proj = vectorDot(raw, kRef); // kRef is unit-norm, so this is raw's component along kRef
  const perp = new Array(dim);
  let perpNorm = 0;
  for (let i = 0; i < dim; i++) {
    const p = raw[i] - proj * kRef[i];
    perp[i] = p;
    perpNorm += p * p;
  }
  perpNorm = Math.sqrt(perpNorm);
  // Degenerate case (raw ended up parallel to kRef): resample by rotating a
  // basis vector instead of giving up on the angle constraint.
  if (perpNorm < 1e-9) {
    for (let i = 0; i < dim; i++) perp[i] = i === 0 ? kRef[1] ?? 0 : i === 1 ? -(kRef[0] ?? 0) : 0;
    perpNorm = Math.sqrt(perp.reduce((s, x) => s + x * x, 0)) || 1;
  }
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const result = new Array(dim);
  for (let i = 0; i < dim; i++) {
    result[i] = cosT * kRef[i] + sinT * (perp[i] / perpNorm);
  }
  return result;
}

/**
 * Hebbian write with a learning rate and exponential forgetting:
 *   M <- (1 - lambda) * M + eta * v * k^T
 * At eta=1, lambda=0 this is exactly writeAssociation. Non-zero lambda decays
 * every prior association uniformly before the new one is superimposed —
 * the mechanism behind gated/delta-rule variants (see docs/citations.md:
 * Gated DeltaNet, Titans) that this app's write-with-decay control exposes.
 */
export function writeWithDecay(M: Matrix, k: Vector, v: Vector, eta: number, lambda: number): Matrix {
  const dim = M.length;
  const newM = createZeroMatrix(dim);
  const keep = 1 - lambda;
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      newM[i][j] = keep * M[i][j] + eta * v[i] * k[j];
    }
  }
  return newM;
}

/**
 * Per-write breakdown of a single memory cell M[i][j], given the ordered
 * list of (key, value) pairs written into it. Returns one contribution per
 * pair — v_m[i] * k_m[j] — so a cell inspector can show exactly which
 * writes account for the cell's current value, and in what proportion.
 */
export interface CellContribution {
  index: number;
  contribution: number;
}

export function cellContributions(pairs: ReadonlyArray<{ key: Vector; value: Vector }>, i: number, j: number): CellContribution[] {
  return pairs.map((p, index) => ({ index, contribution: p.value[i] * p.key[j] }));
}

/**
 * Seeded random-projection encoding of a small integer grid (an ARC-style
 * color grid, values 0-9) into a unit vector of length `dim`. Each
 * (row, col, value) fact scatters a deterministic +/-1 pattern across every
 * output dimension, and the grid's vector is the normalized sum of every
 * cell's pattern — a real, reproducible hashing-trick / random-projection
 * embedding (in the spirit of the Johnson-Lindenstrauss lemma: random +/-1
 * projections approximately preserve distance), not a learned feature
 * extractor. Powers the ARC sandbox's illustration of "grid -> vector ->
 * outer-product write" — never real BDH-CQ inference, which reads token
 * sequences, not a hashed grid encoding.
 */
export function encodeGrid(grid: number[][], dim: number, seed: number): Vector {
  const v = new Array(dim).fill(0);
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const cellSeed = (seed ^ Math.imul(r + 1, 73856093) ^ Math.imul(c + 1, 19349663) ^ Math.imul(row[c] + 1, 83492791)) >>> 0;
      const rng = createRng(cellSeed);
      for (let i = 0; i < dim; i++) v[i] += rng() < 0.5 ? -1 : 1;
    }
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) v[i] /= norm;
  return v;
}

export interface GridCandidate {
  grid: number[][];
  vector: Vector;
}

export interface GridDecodeResult {
  grid: number[][];
  similarity: number;
  index: number;
}

/**
 * Nearest-neighbour cosine decode: given a readout vector, return whichever
 * candidate grid's own encoded vector is most similar. This is how the ARC
 * sandbox turns a continuous v_hat back into a discrete grid — a
 * classification over known outputs, not a generative decode — a different,
 * simpler mechanism than real BDH-CQ's, which the sandbox's "illustration"
 * label exists to keep honest.
 */
export function decodeGrid(vhat: Vector, candidates: ReadonlyArray<GridCandidate>): GridDecodeResult | null {
  if (candidates.length === 0) return null;
  let bestIndex = 0;
  let bestSim = -Infinity;
  candidates.forEach((cand, i) => {
    const sim = cosineSimilarity(vhat, cand.vector);
    if (sim > bestSim) {
      bestSim = sim;
      bestIndex = i;
    }
  });
  return { grid: candidates[bestIndex].grid, similarity: bestSim, index: bestIndex };
}

