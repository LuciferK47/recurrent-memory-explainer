import React, { useMemo } from 'react';
import { project, BlockPolys } from '../../lib/iso';

export interface IsoBlockSpec {
  gx: number;
  gy: number;
  gz: number;
  sx: number;
  sy: number;
  sz: number;
  color: string;
  opacity?: number;
  /** Adds a soft radial glow behind this block — use sparingly, one accent per scene. */
  glow?: string;
}

const CORNERS: Array<[number, number, number]> = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1],
  [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];

function computeBounds(blocks: IsoBlockSpec[], pad: number) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of blocks) {
    for (const [dx, dy, dz] of CORNERS) {
      const p = project(b.gx + dx * b.sx, b.gy + dy * b.sy, b.gz + dz * b.sz);
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return { minX: minX - pad, minY: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
}

interface IsoSceneProps {
  blocks: IsoBlockSpec[];
  size?: number;
  className?: string;
  title: string;
}

/**
 * Shared renderer for the isometric spot-illustration suite. Every scene is a
 * flat list of axis-aligned blocks on the same 2:1 dimetric grid (see
 * lib/iso.ts) — painter's-algorithm sorted back-to-front, bottom-to-top, so
 * scenes can be authored as plain data in `scenes.ts` with no manual
 * z-ordering.
 */
export const IsoScene: React.FC<IsoSceneProps> = ({ blocks, size = 200, className, title }) => {
  const ordered = useMemo(
    () => [...blocks].sort((a, b) => (a.gx + a.gz) * 100 + a.gy - ((b.gx + b.gz) * 100 + b.gy)),
    [blocks]
  );
  const bounds = useMemo(() => computeBounds(blocks, 10), [blocks]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        {ordered.map((b, i) =>
          b.glow ? (
            <radialGradient key={`glow-${i}`} id={`iso-glow-${i}`}>
              <stop offset="0%" stopColor={b.glow} stopOpacity="0.55" />
              <stop offset="100%" stopColor={b.glow} stopOpacity="0" />
            </radialGradient>
          ) : null
        )}
      </defs>
      {ordered.map((b, i) => {
        const center = project(b.gx + b.sx / 2, b.gy + b.sy / 2, b.gz + b.sz / 2);
        const faces = BlockPolys(b.gx, b.gy, b.gz, b.sx, b.sy, b.sz, b.color, b.opacity ?? 1);
        return (
          <g key={i}>
            {b.glow && <circle cx={center.x} cy={center.y} r={44} fill={`url(#iso-glow-${i})`} />}
            <polygon points={faces.right.points} fill={faces.right.fill} opacity={faces.right.opacity} />
            <polygon points={faces.left.points} fill={faces.left.fill} opacity={faces.left.opacity} />
            <polygon points={faces.top.points} fill={faces.top.fill} opacity={faces.top.opacity} />
          </g>
        );
      })}
    </svg>
  );
};
