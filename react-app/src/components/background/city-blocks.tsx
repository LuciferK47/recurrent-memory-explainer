import React from 'react';
import { isoBlock, project, shade, type IsoPoint } from '../../lib/iso';

/**
 * city-blocks.tsx — the isometric circuit-city vocabulary the page's
 * background is built from (see IsoCity.tsx for composition). Every piece
 * is a flat-shaded rectangular prism from lib/iso.ts's isoBlock()/shade() —
 * no new projection math, so this stays visually identical to the
 * illustrations suite (components/illustrations/) it borrows its material
 * language from.
 *
 * These are deliberately dumb/presentational: no randomness lives in here.
 * IsoCity.tsx draws every random choice up front from one seeded rng in a
 * fixed, single-pass order and hands these components plain arrays/booleans
 * — so the scene is reproducible without relying on React's child-render
 * order to keep a shared rng instance in sync.
 */

interface BlockProps {
  gx: number;
  gy: number;
  gz: number;
  sx: number;
  sy: number;
  sz: number;
  color: string;
  opacity?: number;
}

/** One flat-shaded rectangular prism — the atom everything below composes from. */
export const Block: React.FC<BlockProps> = ({ gx, gy, gz, sx, sy, sz, color, opacity = 1 }) => {
  const f = isoBlock(gx, gy, gz, sx, sy, sz);
  return (
    <g opacity={opacity}>
      <polygon points={f.top} fill={shade(color, 0.32)} />
      <polygon points={f.left} fill={shade(color, -0.12)} />
      <polygon points={f.right} fill={shade(color, -0.34)} />
    </g>
  );
};

/** A thin slab a cluster sits on. */
export const Platform: React.FC<{ gx: number; gz: number; sx: number; sz: number; color: string; opacity?: number }> = ({
  gx,
  gz,
  sx,
  sz,
  color,
  opacity,
}) => <Block gx={gx} gy={0} gz={gz} sx={sx} sy={0.3} sz={sz} color={color} opacity={opacity} />;

/** The grid-space box one server-rack cell occupies — exported so a write-pulse flash overlay can target the exact cell a rack renders, without re-deriving the formula and risking drift. */
export function rackCellGeometry(gx: number, gz: number, height: number, footprint: number, rows: number, index: number) {
  const cellH = ((height - 0.7) / rows) * 0.6;
  const y = 0.35 + (index * (height - 0.7)) / rows;
  return { gx: gx + footprint + 0.015, gy: y, gz: gz + footprint * 0.2, sx: 0.05, sy: cellH, sz: footprint * 0.55 };
}

/** A tall server prism with a column of small lit/unlit cells on its facing edge. */
export const ServerRack: React.FC<{
  gx: number;
  gz: number;
  height: number;
  footprint?: number;
  color: string;
  litColor: string;
  litMask: readonly boolean[];
  opacity?: number;
}> = ({ gx, gz, height, footprint = 1.1, color, litColor, litMask, opacity = 1 }) => {
  const rows = litMask.length;
  return (
    <g opacity={opacity}>
      <Block gx={gx} gy={0} gz={gz} sx={footprint} sy={height} sz={footprint} color={color} />
      {litMask.map((lit, i) => {
        const cell = rackCellGeometry(gx, gz, height, footprint, rows, i);
        return (
          <Block
            key={i}
            {...cell}
            color={lit ? litColor : shade(color, -0.45)}
            opacity={lit ? 1 : 0.55}
          />
        );
      })}
    </g>
  );
};

/** A wide flat processor block with a pin fringe and a centered mono label. */
export const CpuBlock: React.FC<{
  gx: number;
  gz: number;
  sx: number;
  sz: number;
  color: string;
  label?: string;
  opacity?: number;
}> = ({ gx, gz, sx, sz, color, label, opacity = 1 }) => {
  const pinCount = 5;
  const pins: React.ReactNode[] = [];
  for (let i = 0; i < pinCount; i++) {
    const t = (i + 0.5) / pinCount;
    pins.push(
      <Block key={`px${i}`} gx={gx + t * sx - 0.03} gy={0.55} gz={gz - 0.12} sx={0.06} sy={0.1} sz={0.12} color={shade(color, -0.15)} />,
      <Block key={`pz${i}`} gx={gx - 0.12} gy={0.55} gz={gz + t * sz - 0.03} sx={0.12} sy={0.1} sz={0.06} color={shade(color, -0.15)} />
    );
  }
  const labelPos = project(gx + sx / 2, 0.55, gz + sz / 2);
  return (
    <g opacity={opacity}>
      {pins}
      <Block gx={gx} gy={0} gz={gz} sx={sx} sy={0.55} sz={sz} color={color} />
      {label && (
        <text
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Departure Mono', monospace"
          fontSize={9}
          fontWeight={600}
          letterSpacing={1}
          fill={shade(color, 0.55)}
        >
          {label}
        </text>
      )}
    </g>
  );
};

/** Project a sequence of grid-space waypoints to screen space. */
export function tracePoints(points: readonly (readonly [number, number, number])[]): IsoPoint[] {
  return points.map(([gx, gy, gz]) => project(gx, gy, gz));
}

/** SVG path `d` string through a sequence of grid-space waypoints — shared by the static trace line and its animated pulse overlay so the two stay pixel-aligned. */
export function tracePath(points: readonly (readonly [number, number, number])[]): string {
  const pts = tracePoints(points);
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

/** A board trace: an iso-space polyline with junction dots at its interior turns. */
export const TraceRun: React.FC<{
  points: readonly (readonly [number, number, number])[];
  color: string;
  width?: number;
  opacity?: number;
  junctions?: boolean;
}> = ({ points, color, width = 1.6, opacity = 1, junctions = true }) => {
  const pts = tracePoints(points);
  return (
    <g opacity={opacity}>
      <path d={tracePath(points)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      {junctions &&
        pts.slice(1, -1).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={width * 1.4} fill={color} />)}
    </g>
  );
};

export interface NetEdge {
  from: number;
  to: number;
}

/** The small key→value node diagram sitting on its own platform — a deliberate callback to the page's own matrix/graph visuals. */
export const NetBoard: React.FC<{
  gx: number;
  gz: number;
  sx: number;
  sz: number;
  baseColor: string;
  keyColor: string;
  valueColor: string;
  edges: readonly NetEdge[];
  nodeCount: number;
  opacity?: number;
}> = ({ gx, gz, sx, sz, baseColor, keyColor, valueColor, edges, nodeCount, opacity = 1 }) => {
  const topY = 0.32;
  const leftX = gx + sx * 0.24;
  const rightX = gx + sx * 0.76;
  const keyPts: IsoPoint[] = [];
  const valPts: IsoPoint[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const t = (i + 0.5) / nodeCount;
    const z = gz + t * sz;
    keyPts.push(project(leftX, topY, z));
    valPts.push(project(rightX, topY, z));
  }
  return (
    <g opacity={opacity}>
      <Platform gx={gx} gz={gz} sx={sx} sz={sz} color={baseColor} />
      {edges.map((e, i) => (
        <line
          key={i}
          x1={keyPts[e.from].x}
          y1={keyPts[e.from].y}
          x2={valPts[e.to].x}
          y2={valPts[e.to].y}
          stroke={i % 2 === 0 ? keyColor : valueColor}
          strokeWidth={0.8}
          opacity={0.6}
        />
      ))}
      {keyPts.map((p, i) => (
        <circle key={`k${i}`} cx={p.x} cy={p.y} r={2.4} fill={keyColor} />
      ))}
      {valPts.map((p, i) => (
        <circle key={`v${i}`} cx={p.x} cy={p.y} r={2.4} fill={valueColor} />
      ))}
    </g>
  );
};

/** A thin upright panel with a tinted screen edge. */
export const Monitor: React.FC<{
  gx: number;
  gz: number;
  sx: number;
  sy: number;
  frameColor: string;
  screenColor: string;
  opacity?: number;
}> = ({ gx, gz, sx, sy, frameColor, screenColor, opacity = 1 }) => (
  <g opacity={opacity}>
    <Block gx={gx} gy={0} gz={gz} sx={sx} sy={sy} sz={0.1} color={frameColor} />
    <Block gx={gx + sx + 0.01} gy={sy * 0.16} gz={gz + 0.02} sx={0.03} sy={sy * 0.68} sz={0.06} color={screenColor} opacity={0.92} />
  </g>
);

/** A small voxel pixel-figure — deliberately minimal, two blocks. */
export const Figure: React.FC<{ gx: number; gz: number; color: string; scale?: number; opacity?: number }> = ({
  gx,
  gz,
  color,
  scale = 1,
  opacity = 1,
}) => {
  const w = 0.22 * scale;
  const bodyH = 0.55 * scale;
  const headH = 0.22 * scale;
  return (
    <g opacity={opacity}>
      <Block gx={gx} gy={0} gz={gz} sx={w} sy={bodyH} sz={w} color={color} />
      <Block gx={gx + w * 0.15} gy={bodyH} gz={gz + w * 0.15} sx={w * 0.7} sy={headH} sz={w * 0.7} color={shade(color, 0.2)} />
    </g>
  );
};
