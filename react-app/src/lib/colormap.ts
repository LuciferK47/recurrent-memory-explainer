/**
 * Diverging heatmap colormap — interference red -> panel neutral -> memory blue.
 *
 * Precomputes 512 CSS color strings ONCE at module load, so the per-cell,
 * per-frame lookup in the render loop is a plain array index — zero string
 * allocation. This is the direct fix for the audited hot-path bug in the
 * legacy MemoryLab canvas (a template-literal `rgb(${r},${g},${b})` built
 * fresh for every one of up to 1024 cells, every frame).
 *
 * The three stops are the same INTERFERENCE/LINEN/MEMORY tokens the rest of
 * the Stage panel draws with (see stage/render/theme.ts) — near-zero cells
 * fade toward the panel's own dim neutral tone instead of pure black, so a
 * mostly-empty matrix reads as "quiet," not as a wall of void.
 */
import { lerp, clamp01 } from './easing';
import { INTERFERENCE, LINEN, MEMORY } from '../stage/render/theme';

const STEPS = 512;
const NEG: readonly [number, number, number] = INTERFERENCE; // #FF6B6B
const MID: readonly [number, number, number] = LINEN; // #1C2E38 dim panel neutral
const POS: readonly [number, number, number] = MEMORY; // #00D2FF

function build(): string[] {
  const table = new Array<string>(STEPS);
  for (let i = 0; i < STEPS; i++) {
    const t = i / (STEPS - 1); // 0..1 maps to norm -1..1
    let r: number, g: number, b: number;
    if (t < 0.5) {
      const u = t / 0.5;
      r = lerp(NEG[0], MID[0], u);
      g = lerp(NEG[1], MID[1], u);
      b = lerp(NEG[2], MID[2], u);
    } else {
      const u = (t - 0.5) / 0.5;
      r = lerp(MID[0], POS[0], u);
      g = lerp(MID[1], POS[1], u);
      b = lerp(MID[2], POS[2], u);
    }
    table[i] = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  }
  return table;
}

const COLORMAP: readonly string[] = build();

/** norm expected in [-1, 1] (a cell value already divided by the matrix's current max-abs). */
export function colormapFor(norm: number): string {
  const t = clamp01((norm + 1) / 2);
  return COLORMAP[Math.round(t * (COLORMAP.length - 1))];
}
