import React from 'react';
import { motion, type MotionValue } from 'motion/react';
import {
  Block,
  CpuBlock,
  Figure,
  Monitor,
  NetBoard,
  Platform,
  ServerRack,
  TraceRun,
  rackCellGeometry,
  tracePath,
} from './city-blocks';
import { NET_BOARD_NODES, RIGHT_RACK_A_ROWS, type CityData } from './city-data';

/**
 * IsoCity.tsx — composes city-blocks.tsx into the two structure clusters
 * (left: net board + rack + figures; right: CPU + rack stack + monitors)
 * plus a distant trace field, matching the reference: a full isometric
 * circuit-city, not an abstract node graph. Full-bleed and dense now, not
 * confined to page margins — it sits over a blurred plate of the original
 * reference image (see ScaleFreeBackground.tsx) rather than trying to be
 * hidden behind a text-column mask. Colors come from the site's own dark
 * palette (built by the caller from stage/render/theme.ts, plus a
 * dedicated dark `structure` tone — see the Palette doc below) so it
 * re-themes for free; geometry and randomness are supplied by the caller
 * (city-data.ts) so this file stays a pure composition.
 */

/** A handful of hand-authored distant board traces + via dots — the same
 * network language the previous background used, restyled to read as a
 * distant circuit trace-scape the city sits on rather than a standalone
 * diagram. Kept static (no rng) since exact positions don't matter here. */
const FAR_LINES: [number, number, number, number][] = [
  [220, 780, 420, 700], [220, 780, 120, 640], [420, 700, 620, 760],
  [620, 760, 780, 690], [180, 560, 420, 700], [780, 690, 980, 640],
  [980, 640, 1180, 700], [1180, 700, 1320, 640], [980, 640, 900, 500],
  [420, 700, 380, 520], [1180, 700, 1260, 820], [140, 300, 300, 240],
  [300, 240, 500, 260], [500, 260, 640, 180], [780, 200, 940, 260],
  [940, 260, 1120, 220], [640, 180, 780, 200], [1120, 220, 1300, 280],
  [500, 260, 480, 420], [940, 260, 960, 420],
];
const FAR_HUBS: [number, number][] = [
  [220, 780], [420, 700], [620, 760], [780, 690], [980, 640], [1180, 700],
  [300, 240], [500, 260], [640, 180], [780, 200], [940, 260], [1120, 220],
];

/**
 * `structure` is a dedicated dark slate tone for building bodies — NOT the
 * theme's `ink` token. `ink` is now the page's light foreground text color
 * (the dark→light palette flip), and lib/iso.ts's shade() mixes a block's
 * top face toward white / sides toward black: feeding it an already-light
 * base color for a "building" produces a washed-out near-white structure.
 * Feeding it this dark base instead reproduces the same lit-from-above 3D
 * look the light-palette version had, just the correct way round for a
 * dark scene. `ink` itself is kept for the far layer's hairline traces and
 * via-dots, where light-on-dark is exactly what's wanted.
 */
interface Palette {
  structure: string;
  ink: string;
  memory: string;
  truth: string;
  synapse: string;
  data: string;
}

export interface CityEvent {
  id: number;
}

interface IsoCityProps {
  palette: Palette;
  cityData: CityData;
  events: readonly CityEvent[];
  reducedMotion: boolean;
  yFar?: MotionValue<number>;
  yMid?: MotionValue<number>;
  yNear?: MotionValue<number>;
}

const LEFT_ORIGIN = { x: 165, y: 660 };
const RIGHT_ORIGIN = { x: 1210, y: 640 };

// Right-cluster geometry, named so the CPU write-pulse can reuse the exact
// rack/CPU coordinates below rather than duplicating magic numbers.
const RACK_A = { gx: 0, gz: 0, height: 4.6, footprint: 1.1 };
const CPU = { gx: 2.05, gz: 0.35, sx: 2.3, sz: 2.0 };
const CPU_PULSE_POINTS: readonly (readonly [number, number, number])[] = [
  [RACK_A.gx + RACK_A.footprint, 0.03, RACK_A.gz + 0.5],
  [RACK_A.gx + RACK_A.footprint + 0.6, 0.03, RACK_A.gz + 0.5],
  [RACK_A.gx + RACK_A.footprint + 0.6, 0.03, RACK_A.gz - 0.55],
  [CPU.gx, 0.03, CPU.gz - 0.55],
  [CPU.gx, 0.03, CPU.gz + 0.3],
];

export const IsoCity: React.FC<IsoCityProps> = ({ palette, cityData, events, reducedMotion, yFar, yMid, yNear }) => {
  const farStyle = reducedMotion || !yFar ? undefined : { y: yFar };
  const midStyle = reducedMotion || !yMid ? undefined : { y: yMid };
  const nearStyle = reducedMotion || !yNear ? undefined : { y: yNear };

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
    >
      {/* Far: distant trace field the city sits on. Light-on-dark now, so
          it's a genuinely visible circuit-board texture, not a near-
          invisible wash. */}
      <motion.g style={farStyle} opacity={0.95}>
        <g stroke={palette.memory} strokeWidth={1} opacity={0.4}>
          {FAR_LINES.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
        <g fill={palette.ink} opacity={0.45}>
          {FAR_HUBS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.6} />
          ))}
        </g>
      </motion.g>

      {/* Mid: the grounded structures — net board, rack bodies, platforms. */}
      <motion.g style={midStyle}>
        <g transform={`translate(${LEFT_ORIGIN.x}, ${LEFT_ORIGIN.y})`} opacity={0.96}>
          <NetBoard
            gx={0}
            gz={0}
            sx={2.6}
            sz={2.2}
            baseColor={palette.structure}
            keyColor={palette.memory}
            valueColor={palette.truth}
            edges={cityData.netEdges}
            nodeCount={NET_BOARD_NODES}
          />
          <ServerRack
            gx={3.3}
            gz={0.15}
            height={4.2}
            footprint={1.05}
            color={palette.structure}
            litColor={palette.data}
            litMask={cityData.leftRackLit}
          />
          <Platform gx={3.15} gz={1.6} sx={1.35} sz={1.2} color={palette.structure} opacity={0.9} />
        </g>

        <g transform={`translate(${RIGHT_ORIGIN.x}, ${RIGHT_ORIGIN.y})`} opacity={0.96}>
          <ServerRack
            gx={RACK_A.gx}
            gz={RACK_A.gz}
            height={RACK_A.height}
            footprint={RACK_A.footprint}
            color={palette.structure}
            litColor={palette.truth}
            litMask={cityData.rightRackALit}
          />
          <ServerRack
            gx={0}
            gz={1.65}
            height={3.3}
            footprint={0.95}
            color={palette.structure}
            litColor={palette.data}
            litMask={cityData.rightRackBLit}
          />
          <TraceRun points={CPU_PULSE_POINTS} color={palette.synapse} width={1.3} opacity={0.55} />
        </g>
      </motion.g>

      {/* Near: the CPU, monitors, and figures — closest to camera, largest parallax. */}
      <motion.g style={nearStyle} opacity={0.98}>
        <g transform={`translate(${RIGHT_ORIGIN.x}, ${RIGHT_ORIGIN.y})`}>
          <CpuBlock gx={CPU.gx} gz={CPU.gz} sx={CPU.sx} sz={CPU.sz} color={palette.synapse} label="CPU" opacity={0.95} />
          <Monitor gx={4.75} gz={0.25} sx={0.85} sy={1.05} frameColor={palette.structure} screenColor={palette.memory} opacity={0.95} />
          <Monitor gx={4.75} gz={1.3} sx={0.85} sy={0.85} frameColor={palette.structure} screenColor={palette.data} opacity={0.95} />
          <Figure gx={1.05} gz={2.55} color={palette.structure} scale={0.85} opacity={0.9} />
        </g>
        <g transform={`translate(${LEFT_ORIGIN.x}, ${LEFT_ORIGIN.y})`}>
          <Figure gx={1.15} gz={2.65} color={palette.structure} scale={0.9} opacity={0.9} />
          <Figure gx={4.1} gz={2.5} color={palette.structure} scale={0.75} opacity={0.85} />
        </g>

        {/* Write-pulse events: a bright overlay drawn along the same path as
            the static right-cluster trace (pathLength animates 0→1, framer's
            built-in "draw on" technique) plus a matching rack-cell flash —
            both keyed on the write's event id so they auto-unmount together. */}
        {!reducedMotion && (
          <g transform={`translate(${RIGHT_ORIGIN.x}, ${RIGHT_ORIGIN.y})`}>
            {events.map(evt => (
              <CpuWritePulse key={evt.id} color={palette.synapse} cellColor={palette.truth} eventId={evt.id} />
            ))}
          </g>
        )}
      </motion.g>
    </svg>
  );
};

/** One write's visual event: a traveling glow along CPU_PULSE_POINTS plus a
 * matching flash on one cell of RACK_A, both fading out together. */
const CpuWritePulse: React.FC<{ color: string; cellColor: string; eventId: number }> = ({ color, cellColor, eventId }) => {
  const cellIndex = eventId % RIGHT_RACK_A_ROWS;
  const cell = rackCellGeometry(RACK_A.gx, RACK_A.gz, RACK_A.height, RACK_A.footprint, RIGHT_RACK_A_ROWS, cellIndex);
  return (
    <>
      <motion.path
        d={tracePath(CPU_PULSE_POINTS)}
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.95 }}
        animate={{ pathLength: 1, opacity: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.3, times: [0, 0.35, 1], ease: 'easeOut' }}>
        <Block {...cell} color={cellColor} />
      </motion.g>
    </>
  );
};
