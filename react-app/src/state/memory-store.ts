/**
 * memory-store.ts — external store for the shared associative-memory state.
 *
 * Why external and not React context+reducer: the matrix changes on every
 * write, so a plain context value would re-render every consumer (controls,
 * ledger, capacity meter, scene annotations) on every write regardless of
 * what each actually reads. `useSyncExternalStore` + per-field selectors let
 * each consumer subscribe to only the slice it needs.
 *
 * Three-tier state rule used throughout this app from here on:
 *   1. React state   — via useMemorySelector: dim, pairs, matrix, rev.
 *      Changes at human frequency (clicks), fine to re-render on.
 *   2. MotionValue    — scroll/animation progress (introduced in the Stage
 *      work). Never touches this store.
 *   3. Ref            — `hover` / `focus` below. Mutated directly by pointer
 *      handlers; read directly by the (future) canvas render loop. Never
 *      goes through setState, so a 120Hz mousemove never re-renders React.
 *
 * `createMemoryStore()` is a plain factory with no embedded policy about
 * *what* to write or *why* — random-pair generation, label cycling, and the
 * staged "catchy, not blank" reveal on mount all stay in the consuming
 * component (App.tsx). BreakingPoint's live experiment creates its own
 * separate instance from the same factory rather than duplicating a second,
 * slightly-different copy of this state machine.
 */

import React, { createContext, useContext, useRef, useSyncExternalStore } from 'react';
import { Vector, createZeroMatrix } from '../lib/memory-math';
import { toFlat, writeWithDecayInto, maxAbsFlat } from '../lib/memory-math-flat';

export interface StoredPair {
  id: string;
  key: Vector;
  value: Vector;
  label: string;
  /** Learning rate this pair was written with — 1 unless a decay-write control set it. */
  eta: number;
  /** Decay applied to the rest of the matrix at the moment this pair was written — 0 unless a decay-write control set it. */
  lambda: number;
}

export interface MemorySnapshot {
  dim: number;
  /** Row-major flat matrix, dim*dim. A fresh array per mutation — safe to hold onto. */
  matrix: Float32Array;
  pairs: readonly StoredPair[];
  maxAbs: number;
  rev: number;
}

export interface GridCell {
  r: number;
  c: number;
}

/** v is the row axis (left gutter), k is the column axis (top gutter), m is the whole matrix — see draw-term-highlight.ts. */
export type TermAxis = 'v' | 'k' | 'm';

export interface MemoryStore {
  getSnapshot(): MemorySnapshot;
  subscribe(fn: () => void): () => void;

  setDim(dim: number): void;
  /**
   * The one canonical write primitive — random generation and label policy
   * live in the caller. `eta`/`lambda` default to 1/0 (plain Hebbian write,
   * mathematically identical to the pre-decay path); pass non-default values
   * to genuinely route the write through M <- (1-lambda)*M + eta*v*k^T
   * instead of decorating the call with an unused parameter — see
   * BDHModule's decay control, the only caller that passes them.
   */
  addPair(key: Vector, value: Vector, label: string, eta?: number, lambda?: number): void;
  clear(): void;

  /** Non-reactive channel: mutate `.current` directly, never triggers a render. */
  readonly hover: { current: GridCell | null };
  readonly focus: { current: GridCell | null };
  /** Bidirectional equation<->diagram link target: mutate directly from either side. */
  readonly termHighlight: { current: TermAxis | null };

  /**
   * Wakes any render loop listening via `onRenderRequest` — entirely
   * separate from `subscribe`/`commit`. A hover-only interaction (a cell,
   * a term) must never go through `commit()`: that increments `rev` and
   * re-notifies Stage's write-detection subscriber, which would push a
   * spurious duplicate point onto the cliff-scene's write history on every
   * hover. This channel exists so ref-only pokes can still wake the canvas
   * without touching matrix-change semantics at all.
   */
  requestRender(): void;
  onRenderRequest(fn: () => void): () => void;
}

let nextId = 0;

export function createMemoryStore(initialDim = 8): MemoryStore {
  let dim = initialDim;
  let pairs: StoredPair[] = [];
  let matrixFlat = createMatrixFlat(dim);
  let rev = 0;
  let cached: MemorySnapshot = buildSnapshot();
  const listeners = new Set<() => void>();
  const renderListeners = new Set<() => void>();

  function createMatrixFlat(d: number): Float32Array {
    return toFlat(createZeroMatrix(d));
  }

  function buildSnapshot(): MemorySnapshot {
    return { dim, matrix: matrixFlat, pairs, maxAbs: maxAbsFlat(matrixFlat), rev };
  }

  function commit() {
    rev += 1;
    cached = buildSnapshot();
    listeners.forEach(fn => fn());
  }

  return {
    getSnapshot: () => cached,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    setDim(newDim) {
      dim = newDim;
      pairs = [];
      matrixFlat = createMatrixFlat(dim);
      commit();
    },

    addPair(key, value, label, eta = 1, lambda = 0) {
      // Fresh copy — matrix identity must change for getSnapshot() to
      // differ from the cached snapshot other consumers may still hold.
      const next = new Float32Array(matrixFlat);
      writeWithDecayInto(next, dim, key, value, eta, lambda);
      matrixFlat = next;
      pairs = [...pairs, { id: `pair-${nextId++}`, key, value, label, eta, lambda }];
      commit();
    },

    clear() {
      pairs = [];
      matrixFlat = createMatrixFlat(dim);
      commit();
    },

    hover: { current: null },
    focus: { current: null },
    termHighlight: { current: null },

    requestRender() {
      renderListeners.forEach(fn => fn());
    },
    onRenderRequest(fn) {
      renderListeners.add(fn);
      return () => renderListeners.delete(fn);
    },
  };
}

const MemoryStoreContext = createContext<MemoryStore | null>(null);

export const MemoryStoreProvider: React.FC<{ initialDim?: number; children: React.ReactNode }> = ({
  initialDim = 8,
  children,
}) => {
  const storeRef = useRef<MemoryStore | null>(null);
  if (!storeRef.current) storeRef.current = createMemoryStore(initialDim);
  return React.createElement(MemoryStoreContext.Provider, { value: storeRef.current }, children);
};

export function useMemoryStore(): MemoryStore {
  const store = useContext(MemoryStoreContext);
  if (!store) throw new Error('useMemoryStore must be used within a MemoryStoreProvider');
  return store;
}

/**
 * Subscribe to one derived slice of the store. Re-renders only when the
 * selected value actually changes (by `isEqual`, defaulting to Object.is) —
 * not on every store mutation.
 */
export function useMemorySelector<T>(select: (s: MemorySnapshot) => T, isEqual: (a: T, b: T) => boolean = Object.is): T {
  const store = useMemoryStore();
  const cacheRef = useRef<{ has: boolean; value: T }>({ has: false, value: undefined as unknown as T });

  const getSelected = () => {
    const next = select(store.getSnapshot());
    if (!cacheRef.current.has || !isEqual(cacheRef.current.value, next)) {
      cacheRef.current = { has: true, value: next };
    }
    return cacheRef.current.value;
  };

  return useSyncExternalStore(store.subscribe, getSelected);
}
