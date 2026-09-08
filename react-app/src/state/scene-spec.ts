/**
 * Scene registry for the pinned Stage. `useScrollScene` is written generically
 * over this array — the `weight` is relative scroll length (normalized
 * internally), NOT seconds or pixels.
 */
import { StageLayout } from '../lib/layout';
import * as kvCache from '../stage/scenes/kv-cache';
import * as write from '../stage/scenes/write';
import * as synapse from '../stage/scenes/synapse';
import * as cliff from '../stage/scenes/cliff';

export type SceneId = 'kv-cache' | 'write' | 'synapse' | 'cliff';

export interface SceneSpec {
  id: SceneId;
  weight: number;
  /** Full description — used for the scene-jump buttons' title/aria-label. */
  label: string;
  /** Short chip text for the panel header's scene stepper (see Stage.tsx). */
  navLabel: string;
  /** One line naming what's on screen right now — the panel's caption bar, so the artifact never has to be decoded from the diagram alone. */
  caption: string;
  layoutFor: (p: number) => StageLayout;
}

export const SCENES: readonly SceneSpec[] = [
  {
    id: 'kv-cache',
    weight: 0.8,
    label: 'The growing KV cache',
    navLabel: 'KV-Cache',
    caption: 'A transformer’s KV-cache grows one slot per token — unbounded. Watch the fixed-size matrix grow in beside it instead.',
    layoutFor: kvCache.layoutFor,
  },
  {
    id: 'write',
    weight: 1.4,
    label: 'Writing an association',
    navLabel: 'Write',
    caption: 'The live d×d memory matrix M. Hover or arrow-key a cell to see which writes contributed to its value.',
    layoutFor: write.layoutFor,
  },
  {
    id: 'synapse',
    weight: 0.9,
    label: 'Synaptic connections',
    navLabel: 'Synapse',
    caption: 'The same matrix, redrawn as BDH’s bipartite key→value graph — edge color and thickness track the sign and size of M[i,j].',
    layoutFor: synapse.layoutFor,
  },
  {
    id: 'cliff',
    weight: 1.0,
    label: 'The interference cliff',
    navLabel: 'Cliff',
    caption: 'Mean recall vs. associations stored. Dashed band is the precomputed sweep; solid line is your own writes on this page.',
    layoutFor: cliff.layoutFor,
  },
];

export const TOTAL_WEIGHT: number = SCENES.reduce((s, sc) => s + sc.weight, 0);

/** Cumulative scene boundaries in [0, 1] of total scroll progress, length SCENES.length + 1. */
export const SCENE_BOUNDS: readonly number[] = (() => {
  const bounds = [0];
  let acc = 0;
  for (const s of SCENES) {
    acc += s.weight / TOTAL_WEIGHT;
    bounds.push(acc);
  }
  return bounds;
})();
