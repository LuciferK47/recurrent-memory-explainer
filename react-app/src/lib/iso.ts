/**
 * iso.ts — Shared isometric (2:1 dimetric) voxel-projection primitive.
 *
 * Every illustration in `components/illustrations/` is built from the same
 * `isoBlock()` unit so the whole spot-icon suite reads as one consistent
 * material — flat-shaded rectangular prisms on a fixed 2:1 grid, top face
 * lightest, left face mid-tone, right face darkest. No perspective, no
 * gradients: this is deliberately closer to voxel art than to full 3D, so it
 * stays crisp at small sizes and cheap to hand-author precisely.
 *
 * Grid convention: `gx` runs right, `gz` runs toward the back-right (depth),
 * `gy` runs up. One grid unit == `TILE` screen px at scale 1.
 */

export const TILE = 28; // tile half-width, px
const TILE_H = TILE / 2; // 2:1 dimetric: half-height is half the half-width
const UNIT_H = 22; // px per one grid unit of block height

export interface IsoPoint {
  x: number;
  y: number;
}

export interface IsoFaces {
  top: string; // polygon points attr
  left: string;
  right: string;
}

/** Project a grid-space point (gx, gy, gz) to 2D screen space. */
export function project(gx: number, gy: number, gz: number): IsoPoint {
  return {
    x: (gx - gz) * TILE,
    y: (gx + gz) * TILE_H - gy * UNIT_H,
  };
}

function pts(points: IsoPoint[]): string {
  return points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

/**
 * A rectangular prism spanning [gx, gx+sx] x [gz, gz+sz] in the ground plane,
 * from height gy to gy+sy. Returns the three visible-face polygons (top,
 * left, right) as ready-to-use SVG `points` strings.
 */
export function isoBlock(gx: number, gy: number, gz: number, sx: number, sy: number, sz: number): IsoFaces {
  // 8 corners of the prism in grid space
  const bottomFront = project(gx, gy, gz + sz); // near-bottom
  const bottomRight = project(gx + sx, gy, gz + sz);
  const bottomBack = project(gx + sx, gy, gz);
  const bottomLeft = project(gx, gy, gz);
  const topFront = project(gx, gy + sy, gz + sz);
  const topRight = project(gx + sx, gy + sy, gz + sz);
  const topBack = project(gx + sx, gy + sy, gz);
  const topLeft = project(gx, gy + sy, gz);

  return {
    top: pts([topLeft, topBack, topRight, topFront]),
    left: pts([bottomFront, bottomLeft, topLeft, topFront]),
    right: pts([bottomFront, topFront, topRight, bottomRight]),
  };
}

/** Shade a `#rrggbb` hex color toward black (negative) or white (positive). */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const mix = (c: number) => (amt >= 0 ? clamp(c + (255 - c) * amt) : clamp(c * (1 + amt)));
  return `#${[mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Render one flat-shaded block as three <polygon> elements, given a base color. */
export function BlockPolys(gx: number, gy: number, gz: number, sx: number, sy: number, sz: number, base: string, opacity = 1) {
  const f = isoBlock(gx, gy, gz, sx, sy, sz);
  return {
    top: { points: f.top, fill: shade(base, 0.32), opacity },
    left: { points: f.left, fill: shade(base, -0.12), opacity },
    right: { points: f.right, fill: shade(base, -0.34), opacity },
  };
}
