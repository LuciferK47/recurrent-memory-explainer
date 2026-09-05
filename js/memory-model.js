/**
 * memory-model.js — Core Toy Associative Memory
 *
 * This is the REAL SUBSTRATE of the explainer. Every interaction the learner
 * does (inject a pair, query a key) runs through this code in real time.
 *
 * Mechanism: outer-product / Hebbian write into a fixed-size d×d matrix.
 *   Write: M ← M + v · kᵀ
 *   Read:  v̂ = M · q
 *
 * This is a TOY MODEL implementing the same mathematical mechanism that
 * BDH uses for synaptic memory (arXiv:2509.26507, Section 3) and that
 * BDH-CQ uses for absorbing demonstrations (arXiv:2608.09888, Section 3).
 * It is NOT the actual BDH/BDH-CQ system.
 */

export class AssociativeMemory {
    /**
     * @param {number} dim - Dimension of the memory (d). Memory matrix is d×d.
     */
    constructor(dim) {
        this.dim = dim;
        this.M = this._zeros(dim, dim);
        this.storedPairs = []; // Track stored (key, value, label) for visualization
    }

    /**
     * Create a dim×dim zero matrix.
     */
    _zeros(rows, cols) {
        return Array.from({ length: rows }, () => new Float64Array(cols));
    }

    /**
     * Hebbian write: M ← M + v · kᵀ (outer product)
     * This is the core mechanism — same math as BDH's synaptic plasticity.
     *
     * @param {Float64Array} key - Key vector (d-dimensional, should be unit-norm)
     * @param {Float64Array} value - Value vector (d-dimensional)
     * @param {string} [label] - Human-readable label for this association
     */
    write(key, value, label = '') {
        for (let i = 0; i < this.dim; i++) {
            for (let j = 0; j < this.dim; j++) {
                this.M[i][j] += value[i] * key[j];
            }
        }
        this.storedPairs.push({
            key: Array.from(key),
            value: Array.from(value),
            label: label || `Pair ${this.storedPairs.length + 1}`
        });
    }

    /**
     * Linear readout: v̂ = M · q
     *
     * @param {Float64Array} query - Query vector (d-dimensional)
     * @returns {Float64Array} Retrieved value vector
     */
    read(query) {
        const result = new Float64Array(this.dim);
        for (let i = 0; i < this.dim; i++) {
            let sum = 0;
            for (let j = 0; j < this.dim; j++) {
                sum += this.M[i][j] * query[j];
            }
            result[i] = sum;
        }
        return result;
    }

    /**
     * Query all stored keys and return recall accuracy for each.
     * @returns {Array<{label: string, similarity: number, retrieved: number[], expected: number[]}>}
     */
    recallAll() {
        return this.storedPairs.map(pair => {
            const key = new Float64Array(pair.key);
            const retrieved = this.read(key);
            const expected = new Float64Array(pair.value);
            return {
                label: pair.label,
                similarity: cosineSimilarity(retrieved, expected),
                retrieved: Array.from(retrieved),
                expected: Array.from(expected),
            };
        });
    }

    /**
     * Reset memory to zeros.
     */
    clear() {
        this.M = this._zeros(this.dim, this.dim);
        this.storedPairs = [];
    }

    /**
     * @returns {number} Number of stored associations.
     */
    get count() {
        return this.storedPairs.length;
    }

    /**
     * @returns {number} Capacity ratio: stored / dim.
     */
    get capacityRatio() {
        return this.storedPairs.length / this.dim;
    }

    /**
     * Get memory matrix as a flat 2D array for heatmap visualization.
     * @returns {number[][]}
     */
    getMatrix() {
        return this.M.map(row => Array.from(row));
    }

    /**
     * Get the Frobenius norm of the memory matrix.
     * @returns {number}
     */
    getFrobeniusNorm() {
        let sum = 0;
        for (let i = 0; i < this.dim; i++) {
            for (let j = 0; j < this.dim; j++) {
                sum += this.M[i][j] * this.M[i][j];
            }
        }
        return Math.sqrt(sum);
    }

    /**
     * Get mean recall similarity across all stored pairs.
     * @returns {number}
     */
    getMeanRecall() {
        if (this.storedPairs.length === 0) return 1.0;
        const recalls = this.recallAll();
        const sum = recalls.reduce((acc, r) => acc + r.similarity, 0);
        return sum / recalls.length;
    }
}

/**
 * Cosine similarity between two vectors.
 * @param {Float64Array|number[]} a
 * @param {Float64Array|number[]} b
 * @returns {number} Similarity in [-1, 1]
 */
export function cosineSimilarity(a, b) {
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

/**
 * Generate a random unit vector of given dimension.
 * @param {number} dim
 * @returns {Float64Array}
 */
export function randomUnitVector(dim) {
    const v = new Float64Array(dim);
    let norm = 0;
    for (let i = 0; i < dim; i++) {
        // Box-Muller for approximate normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        v[i] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        norm += v[i] * v[i];
    }
    norm = Math.sqrt(norm);
    for (let i = 0; i < dim; i++) {
        v[i] /= norm;
    }
    return v;
}

/**
 * Generate a labeled random unit vector with a semantic name.
 * @param {number} dim
 * @param {string} label
 * @returns {{vector: Float64Array, label: string}}
 */
export function namedRandomVector(dim, label) {
    return { vector: randomUnitVector(dim), label };
}
