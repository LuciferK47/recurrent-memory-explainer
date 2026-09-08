import { createRng } from '../../lib/memory-math';
import type { NetEdge } from './city-blocks';

/**
 * All the randomness the isometric city needs, drawn once from one seeded
 * rng in a fixed order — so the scene is byte-identical on every load. Kept
 * separate from city-blocks.tsx (pure presentational) and IsoCity.tsx
 * (composition) so the random draws never depend on React's render order.
 */

/** Fixed so the background never differs between reloads or environments. */
const CITY_SEED = 2026_0908;

export const LEFT_RACK_ROWS = 6;
export const RIGHT_RACK_A_ROWS = 7;
export const RIGHT_RACK_B_ROWS = 5;
export const NET_BOARD_NODES = 4;

export interface CityData {
  leftRackLit: boolean[];
  rightRackALit: boolean[];
  rightRackBLit: boolean[];
  netEdges: NetEdge[];
}

function litMask(rng: () => number, rows: number, density: number): boolean[] {
  return Array.from({ length: rows }, () => rng() < density);
}

export function generateCityData(): CityData {
  const rng = createRng(CITY_SEED);

  const leftRackLit = litMask(rng, LEFT_RACK_ROWS, 0.42);
  const rightRackALit = litMask(rng, RIGHT_RACK_A_ROWS, 0.4);
  const rightRackBLit = litMask(rng, RIGHT_RACK_B_ROWS, 0.4);

  const netEdges: NetEdge[] = [];
  for (let i = 0; i < NET_BOARD_NODES; i++) {
    for (let j = 0; j < NET_BOARD_NODES; j++) {
      if (rng() < 0.32) netEdges.push({ from: i, to: j });
    }
  }

  return { leftRackLit, rightRackALit, rightRackBLit, netEdges };
}
