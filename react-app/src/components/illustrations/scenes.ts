import type { IsoBlockSpec } from './IsoScene';

/**
 * The isometric spot-illustration suite — five section anchors sharing one
 * neutral "stone" material plus the app's semantic accent hues. Deployed the
 * way Caldera's identity deploys its isometric art: discrete, small, at
 * section anchors — never as full-bleed background wallpaper (see
 * ScaleFreeBackground.tsx for the deliberately-quiet substrate instead).
 */

const STONE = '#2A424E';
const STONE_DIM = '#1B2E38';
const MEMORY = '#00D2FF';
const INTERFERENCE = '#FF6B6B';
const SYNAPSE = '#A78BFA';
const DATA = '#FBBF24';

/** Hero / Memory Lab — a lit cell in a grid of fixed-size memory. */
export const memoryBankScene: IsoBlockSpec[] = [
  { gx: 0, gy: 0, gz: 0, sx: 3, sy: 0.35, sz: 3, color: STONE },
  ...[0, 1, 2].flatMap(row =>
    [0, 1, 2].map(col => {
      const isCenter = row === 1 && col === 1;
      return {
        gx: 0.15 + col * 1.0,
        gy: 0.35,
        gz: 0.15 + row * 1.0,
        sx: 0.7,
        sy: isCenter ? 0.85 : 0.5,
        sz: 0.7,
        color: isCenter ? MEMORY : STONE_DIM,
        opacity: isCenter ? 1 : 0.9,
        glow: isCenter ? MEMORY : undefined,
      } satisfies IsoBlockSpec;
    })
  ),
];

/** Problem Comparison — an ascending, widening stack (O(n)) beside one steady block (O(1)). */
export const kvCacheScene: IsoBlockSpec[] = [
  { gx: -0.3, gy: 0, gz: -0.3, sx: 3.2, sy: 0.3, sz: 2.3, color: STONE_DIM },
  ...[0.5, 0.62, 0.74, 0.86, 0.98].map((size, i) => ({
    gx: 0.5 - size / 2,
    gy: 0.3 + i * 0.32,
    gz: 1.0 - size / 2,
    sx: size,
    sy: 0.32,
    sz: size,
    color: INTERFERENCE,
    opacity: 0.75 + i * 0.05,
  })),
  { gx: 1.6, gy: 0.3, gz: 0.2, sx: 1.0, sy: 1.0, sz: 1.0, color: MEMORY, glow: MEMORY },
];

/** BDH Module — a small cluster of synaptic nodes above a base plinth. */
export const synapseLatticeScene: IsoBlockSpec[] = [
  { gx: 0, gy: 0, gz: 0, sx: 2.6, sy: 0.25, sz: 2.6, color: STONE },
  { gx: 0.2, gy: 0.25, gz: 0.3, sx: 0.45, sy: 0.45, sz: 0.45, color: SYNAPSE, opacity: 0.7 },
  { gx: 1.8, gy: 0.25, gz: 0.2, sx: 0.45, sy: 0.45, sz: 0.45, color: SYNAPSE, opacity: 0.7 },
  { gx: 0.3, gy: 0.55, gz: 1.7, sx: 0.5, sy: 0.5, sz: 0.5, color: SYNAPSE, opacity: 0.8 },
  { gx: 1.9, gy: 0.7, gz: 1.6, sx: 0.5, sy: 0.5, sz: 0.5, color: SYNAPSE, opacity: 0.85 },
  { gx: 1.0, gy: 1.1, gz: 0.9, sx: 0.6, sy: 0.6, sz: 0.6, color: SYNAPSE, glow: SYNAPSE },
];

/** Breaking Point — a walled tray of stored pairs, overflowing past capacity. */
export const overflowScene: IsoBlockSpec[] = [
  { gx: 0, gy: 0, gz: 0, sx: 2.6, sy: 0.3, sz: 2.6, color: STONE },
  { gx: 0, gy: 0.3, gz: 0, sx: 2.6, sy: 0.6, sz: 0.25, color: STONE_DIM },
  { gx: 0, gy: 0.3, gz: 0, sx: 0.25, sy: 0.6, sz: 2.6, color: STONE_DIM },
  { gx: 0.5, gy: 0.3, gz: 0.5, sx: 0.7, sy: 0.7, sz: 0.7, color: MEMORY },
  { gx: 1.35, gy: 0.3, gz: 0.5, sx: 0.7, sy: 0.7, sz: 0.7, color: MEMORY, opacity: 0.9 },
  { gx: 0.5, gy: 0.3, gz: 1.35, sx: 0.7, sy: 0.7, sz: 0.7, color: MEMORY, opacity: 0.85 },
  { gx: 0.5, gy: 1.0, gz: 0.5, sx: 0.6, sy: 0.6, sz: 0.6, color: INTERFERENCE, glow: INTERFERENCE },
  { gx: 2.9, gy: 0, gz: 0.6, sx: 0.5, sy: 0.5, sz: 0.5, color: INTERFERENCE, opacity: 0.9 },
  { gx: 2.6, gy: 0, gz: 1.5, sx: 0.45, sy: 0.45, sz: 0.45, color: INTERFERENCE, opacity: 0.8 },
];

/** Evidence Panel — a stack of provenance records, the top one pulled out for inspection. */
export const dataVaultScene: IsoBlockSpec[] = [
  { gx: 0, gy: 0, gz: 0, sx: 2.2, sy: 0.3, sz: 1.6, color: STONE },
  { gx: 0.3, gy: 0.3, gz: 0.3, sx: 1.6, sy: 0.16, sz: 1.0, color: STONE_DIM },
  { gx: 0.3, gy: 0.46, gz: 0.3, sx: 1.6, sy: 0.16, sz: 1.0, color: STONE_DIM, opacity: 0.9 },
  { gx: 0.3, gy: 0.62, gz: 0.3, sx: 1.6, sy: 0.16, sz: 1.0, color: DATA, opacity: 0.85 },
  { gx: 0.3, gy: 0.78, gz: 0.55, sx: 1.6, sy: 0.18, sz: 1.0, color: DATA, glow: DATA },
];

export const isoScenes = {
  'memory-bank': { blocks: memoryBankScene, title: 'A lit cell in a grid of fixed-size memory' },
  'kv-cache': { blocks: kvCacheScene, title: 'A growing stack beside one steady block' },
  'synapse-lattice': { blocks: synapseLatticeScene, title: 'A small cluster of synaptic nodes' },
  overflow: { blocks: overflowScene, title: 'A tray of stored pairs overflowing past capacity' },
  'data-vault': { blocks: dataVaultScene, title: 'A stack of provenance records, one pulled out for inspection' },
} as const;

export type IsoSceneName = keyof typeof isoScenes;
