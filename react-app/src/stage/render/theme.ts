/**
 * Shared canvas color constants for the Stage panel.
 *
 * A <canvas> fillStyle needs an actual computed color string, not
 * `rgb(var(--x))` (that trick only works in DOM/SVG paint properties), so
 * these are the canvas-space equivalents of index.css's :root design
 * tokens, hand-maintained. Keep in sync with index.css's :root values by
 * hand if those ever change.
 *
 * `PANEL_FILL` and `ON_PANEL` are deliberately separate exports, not one
 * value reused both ways: the panel used to be light, so a single white
 * `PANEL_FILL` string doubled as both the chart *background*
 * (draw-graph/draw-matrix/draw-plot) and a foreground *halo/stroke* drawn
 * on top of colored content (draw-cell-highlight's white ring, draw-plot's
 * white point-ring). On a dark panel those two roles need opposite ends of
 * the palette — collapsing them back into one export would make every
 * foreground halo vanish into the background it's supposed to stand out
 * from.
 */

// RGB triples so callers can build rgba() strings at whatever alpha a given
// draw call needs, without re-parsing a hex string on every frame.
export const INK: readonly [number, number, number] = [234, 242, 245]; // #EAF2F5
export const MEMORY: readonly [number, number, number] = [0, 210, 255]; // #00D2FF
export const TRUTH: readonly [number, number, number] = [52, 211, 153]; // #34D399
export const INTERFERENCE: readonly [number, number, number] = [255, 107, 107]; // #FF6B6B
export const SYNAPSE: readonly [number, number, number] = [167, 139, 250]; // #A78BFA
export const DATA: readonly [number, number, number] = [251, 191, 36]; // #FBBF24
/** The diverging heatmap's "quiet/near-zero" midpoint tone — a dim panel-toned neutral, not the page ground itself, so a near-zero cell still reads as "on the instrument" rather than disappearing into the panel behind it. */
export const LINEN: readonly [number, number, number] = [28, 46, 56]; // #1C2E38

/** The fill behind every chart surface (matrix grid, synapse graph, cliff plot, kv buffer). */
export const PANEL_FILL = '#0E2029';
/** A light stroke/halo drawn ON the panel — cell-inspector rings, per-point outlines. The direct replacement for every old `strokeStyle = PANEL_FILL` "white ring" use, now that the panel itself is dark. */
export const ON_PANEL = '#EAF2F5';
/** Hairline grid/border strokes — ink (now light) at low alpha. */
export const GRID_LINE = 'rgba(234,242,245,0.18)';
export const GRID_LINE_SOFT = 'rgba(234,242,245,0.09)';

export function rgba(c: readonly [number, number, number], a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

export function hex(c: readonly [number, number, number]): string {
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
