import React, { useEffect, useRef, useState } from 'react';
import { useScrollScene } from '../hooks/useScrollScene';
import { useStageSurface } from '../hooks/useStageSurface';
import { createRafLoop, RafLoop } from '../hooks/useRafLoop';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useMemoryStore, useMemorySelector, GridCell, MemorySnapshot, TermAxis } from '../state/memory-store';
import { SCENES, SceneId } from '../state/scene-spec';
import { resolveStageLayout } from './resolveLayout';
import { STAGE_W, STAGE_H, syncSurface } from '../lib/canvas';
import { MATRIX_TARGET, Rect, StageLayout } from '../lib/layout';
import { maxAbsFlat, maxAbsDiff, meanRecallFlat } from '../lib/memory-math-flat';
import { randomUnitVector, cellContributions } from '../lib/memory-math';
import { drawMatrix } from './render/draw-matrix';
import { drawWriteEffects, GUTTER } from './render/draw-beams';
import { drawKvBuffer } from './render/draw-kv-buffer';
import { drawSynapseGraph } from './render/draw-graph';
import { drawCliffPlot, CliffPoint, SweepBandPoint } from './render/draw-plot';
import { drawCellHighlight } from './render/draw-cell-highlight';
import { drawTermHighlight } from './render/draw-term-highlight';
import { drawLoupe, pointInRect, LOUPE_RADIUS } from './render/draw-loupe';
import { PANEL_FILL, ON_PANEL } from './render/theme';
import { startWrite, WriteAnim, sampleWrite } from './render/write-anim';
import { StageOverlay } from './StageOverlay';
import { IsoIllustration } from '../components/illustrations/IsoIllustration';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { MemoryLab } from '../components/MemoryLab';
import { BDHModule } from '../components/BDHModule';
import { BreakingPoint } from '../components/BreakingPoint';

const IDLE_LERP_TAU_MS = 90;
const CONVERGE_EPS_FACTOR = 1e-3;
const FLOOD_COUNT = 20;
const FLOOD_TO_STEP_MS = 55;
const CLIFF_HISTORY_CAP = 400;

/** Pinned four-scene canvas instrument for the narrative sections. */
export const Stage: React.FC = () => {
  const scene = useScrollScene();
  const store = useMemoryStore();
  const reducedMotion = usePrefersReducedMotion();
  const dim = useMemorySelector(s => s.dim);
  const pairCount = useMemorySelector(s => s.pairs.length);
  const meanRecall = useMemorySelector(s => meanRecallFlat(s.matrix, s.dim, s.pairs));
  const maxAbs = useMemorySelector(s => maxAbsFlat(s.matrix));

  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const displayRef = useRef<Float32Array>(new Float32Array(0));
  const animRef = useRef<WriteAnim | null>(null);
  const prevPairsLenRef = useRef(0);
  const cliffHistoryRef = useRef<CliffPoint[]>([]);
  const loopRef = useRef<RafLoop | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const shownCellRef = useRef<GridCell | null>(null);
  // The most recently resolved layout/sceneId, written once per tick — lets
  // pointer handlers and the loupe read "what's actually on screen right
  // now" outside the render loop without threading React state through it.
  const layoutRef = useRef<{ layout: StageLayout; sceneId: SceneId } | null>(null);
  // Loupe pointer position in stage units — scene-agnostic (unlike
  // store.hover/focus, which are 'write'-scene cell coordinates only), since
  // the magnifier works over every scene's own frame (matrix, graph, plot,
  // kv buffer).
  const loupePosRef = useRef<{ x: number; y: number } | null>(null);
  // Precomputed Monte Carlo sweep (data/interference_sweep.json), keyed by
  // dimension as a string — same data BreakingPoint.tsx's static chart
  // reads, fetched once here so the cliff scene's live plot can draw it as a
  // reference band. Plain ref (not React state): the render loop reads it
  // directly and a fetch landing doesn't need to trigger a React re-render.
  const sweepBandsRef = useRef<Record<string, SweepBandPoint[]>>({});
  const floodToTimerRef = useRef<number | null>(null);

  useEffect(() => {
    ctxRef.current = canvasRef.current?.getContext('2d') ?? null;
  }, []);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || './';
    let cancelled = false;
    fetch(`${baseUrl}data/interference_sweep.json`)
      .then(r => r.json())
      .then((data: { sweep: Record<string, { data: { n_associations: number; mean: number; std: number }[] }> }) => {
        if (cancelled) return;
        const bands: Record<string, SweepBandPoint[]> = {};
        for (const [d, dd] of Object.entries(data.sweep)) {
          bands[d] = dd.data.map(pt => ({ n: pt.n_associations, mean: pt.mean, std: pt.std }));
        }
        sweepBandsRef.current = bands;
        loopRef.current?.request();
      })
      .catch(() => {
        /* the cliff scene still works with the live trace alone if this fails */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      if (floodToTimerRef.current) window.clearTimeout(floodToTimerRef.current);
    },
    []
  );

  // Detect new pairs written to the shared store -> start (or extend) a
  // write animation, and extend the cliff scene's live write history.
  // Reads the store directly, never through a selector — this must only
  // mutate refs and wake the imperative loop, never render.
  useEffect(() => {
    return store.subscribe(() => {
      const snap = store.getSnapshot();
      const prevLen = prevPairsLenRef.current;

      if (displayRef.current.length !== snap.matrix.length) {
        // Dimension changed (or first mount) — nothing sensible to animate from.
        displayRef.current = new Float32Array(snap.matrix);
        animRef.current = null;
      } else if (snap.pairs.length > prevLen && !reducedMotion) {
        const newPairs = snap.pairs.slice(prevLen);
        animRef.current = startWrite(displayRef.current, snap.dim, newPairs, performance.now());
      } else {
        // Clear, or a reduced-motion write: snap straight to the target.
        displayRef.current = new Float32Array(snap.matrix);
        animRef.current = null;
      }

      // Cliff-scene write history — reset on clear. Deduped by n (a
      // dimension-change commit with no new pair re-fires this subscriber at
      // the same pair count, which used to append a same-n duplicate point
      // and make the trace briefly non-monotonic) and capped so an
      // extended session's flood-and-reset cycles don't grow this unbounded.
      if (snap.pairs.length === 0) {
        cliffHistoryRef.current = [];
      } else {
        const recall = meanRecallFlat(snap.matrix, snap.dim, snap.pairs);
        const hist = cliffHistoryRef.current;
        const last = hist[hist.length - 1];
        if (last && last.n === snap.pairs.length) {
          hist[hist.length - 1] = { n: snap.pairs.length, recall };
        } else {
          hist.push({ n: snap.pairs.length, recall });
          if (hist.length > CLIFF_HISTORY_CAP) hist.splice(0, hist.length - CLIFF_HISTORY_CAP);
        }
      }

      prevPairsLenRef.current = snap.pairs.length;
      loopRef.current?.request();
    });
  }, [store, reducedMotion]);

  // The render loop — created once; reads everything fresh via refs/store
  // each tick, so it never goes stale across re-renders.
  useEffect(() => {
    // Cell inspector tooltip: built with DOM calls (never innerHTML) because
    // pair labels come straight from free-text user input (MemoryLab's
    // Custom Input Sandbox) — interpolating that into innerHTML would be an
    // XSS hole. Positioned via the same cssW-derived scale syncSurface uses,
    // since the canvas's transform is uniform-scaled off width alone and can
    // leave dead space below STAGE_H*scale on non-1000:640 boxes.
    const updateCellTooltip = (cell: GridCell, snap: MemorySnapshot, scale: number) => {
      const el = tooltipRef.current;
      if (!el) return;

      const cellW = MATRIX_TARGET.w / snap.dim;
      const cellH = MATRIX_TARGET.h / snap.dim;
      const cx = MATRIX_TARGET.x + (cell.c + 0.5) * cellW;
      const topEdgeY = MATRIX_TARGET.y + cell.r * cellH;
      const bottomEdgeY = topEdgeY + cellH;

      // Flip below the cell instead of above when there isn't ~90px of room
      // above it — the panel clips with overflow-hidden, so a top-row cell's
      // tooltip would otherwise be cut off against the panel's own edge.
      const preferAbove = topEdgeY * scale > 90;
      el.style.left = `${cx * scale}px`;
      if (preferAbove) {
        el.style.top = `${topEdgeY * scale}px`;
        el.style.transform = 'translate(-50%, calc(-100% - 10px))';
      } else {
        el.style.top = `${bottomEdgeY * scale}px`;
        el.style.transform = 'translate(-50%, 10px)';
      }
      el.hidden = false;

      const value = snap.matrix[cell.r * snap.dim + cell.c];
      const ranked = cellContributions(snap.pairs, cell.r, cell.c)
        .map(c => ({ contribution: c.contribution, label: snap.pairs[c.index]?.label || `pair ${c.index + 1}` }))
        .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
      const top = ranked.slice(0, 4);
      const restCount = ranked.length - top.length;

      el.replaceChildren();

      const header = document.createElement('div');
      header.className = 'font-mono text-[11px] uppercase tracking-wide text-white/65 mb-1';
      header.textContent = `Cell [${cell.r}, ${cell.c}]`;
      el.appendChild(header);

      const valueEl = document.createElement('div');
      valueEl.className = 'font-mono text-sm text-white font-semibold mb-2';
      valueEl.textContent = `M = ${value.toFixed(4)}`;
      el.appendChild(valueEl);

      if (top.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'text-[11px] text-white/70';
        empty.textContent = 'No writes yet — this cell is still zero.';
        el.appendChild(empty);
      } else {
        const list = document.createElement('div');
        list.className = 'space-y-1 font-mono text-[11px] text-white/85';
        for (const c of top) {
          const row = document.createElement('div');
          row.className = 'flex items-center gap-3';
          const labelEl = document.createElement('span');
          labelEl.className = 'truncate max-w-[130px] flex-1';
          labelEl.textContent = c.label;
          const valEl = document.createElement('span');
          valEl.className = c.contribution >= 0 ? 'text-truth shrink-0' : 'text-interference shrink-0';
          valEl.textContent = `${c.contribution >= 0 ? '+' : ''}${c.contribution.toFixed(4)}`;
          row.appendChild(labelEl);
          row.appendChild(valEl);
          list.appendChild(row);
        }
        el.appendChild(list);
        if (restCount > 0) {
          const more = document.createElement('div');
          more.className = 'text-[11px] text-white/55 mt-1';
          more.textContent = `+${restCount} more write${restCount === 1 ? '' : 's'} contributing to this cell`;
          el.appendChild(more);
        }
      }

      shownCellRef.current = cell;
    };

    const hideCellTooltip = () => {
      if (!shownCellRef.current) return;
      const el = tooltipRef.current;
      if (el) el.hidden = true;
      shownCellRef.current = null;
    };

    const tick = (): boolean => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const box = boxRef.current;
      if (!canvas || !ctx || !box) return false;

      const cssW = box.clientWidth;
      const cssH = box.clientHeight;
      if (cssW === 0 || cssH === 0) return false;
      syncSurface(canvas, ctx, cssW, cssH);

      const snap = store.getSnapshot();
      const now = performance.now();
      const { layout, sceneId } = resolveStageLayout(scene.frameRef.current.scenePosition);
      layoutRef.current = { layout, sceneId };

      let stillAnimating = false;
      const anim = animRef.current;
      if (anim) {
        stillAnimating = sampleWrite(anim, now, displayRef.current);
        if (!stillAnimating) animRef.current = null;
      } else {
        // Idle relaxation toward the authoritative target — normally a no-op
        // (display already equals target) except right after a reduced-motion
        // write or a dimension change, where it converges in a couple of frames.
        const k = 1 - Math.exp(-16 / IDLE_LERP_TAU_MS);
        const disp = displayRef.current;
        const target = snap.matrix;
        let maxDelta = 0;
        for (let i = 0; i < disp.length; i++) {
          disp[i] += (target[i] - disp[i]) * k;
          const ad = Math.abs(target[i] - disp[i]);
          if (ad > maxDelta) maxDelta = ad;
        }
        const eps = Math.max(1e-4, maxAbsFlat(target) * CONVERGE_EPS_FACTOR);
        if (maxDelta > eps) {
          stillAnimating = true;
        } else if (maxAbsDiff(disp, target) > 0) {
          disp.set(target);
        }
      }

      ctx.clearRect(0, 0, STAGE_W, STAGE_H);

      if (layout.kvBuffer.opacity > 0.002) drawKvBuffer(ctx, layout.kvBuffer.frame, layout.kvBuffer.opacity);

      if (layout.matrix.opacity > 0.002) {
        const maxAbs = maxAbsFlat(snap.matrix);
        const gridAlpha = layout.matrix.opacity * (1 - layout.matrix.graphness);
        const graphAlpha = layout.matrix.opacity * layout.matrix.graphness;
        if (gridAlpha > 0.002) drawMatrix(ctx, displayRef.current, snap.dim, layout.matrix.frame, gridAlpha, maxAbs);
        if (graphAlpha > 0.002) drawSynapseGraph(ctx, displayRef.current, snap.dim, layout.matrix.frame, graphAlpha, maxAbs);
      }

      if (sceneId === 'write' && animRef.current && layout.matrix.gutterOpacity > 0.002) {
        drawWriteEffects(ctx, snap.dim, layout.matrix.frame, animRef.current, now);
      }

      if (layout.plot.opacity > 0.002) {
        drawCliffPlot(
          ctx,
          layout.plot.frame,
          layout.plot.opacity,
          snap.dim,
          cliffHistoryRef.current,
          sweepBandsRef.current[String(snap.dim)]
        );
      }

      // Equation<->diagram term link: drawn before the cell highlight so a
      // hovered cell's crisp white box still reads on top of the broader
      // v/k/M glow. Same 'write'-scene gate as the cell inspector.
      const axis: TermAxis | null = sceneId === 'write' ? store.termHighlight.current : null;
      if (axis) drawTermHighlight(ctx, layout.matrix.frame, axis);

      // Cell inspector: hover wins over keyboard focus; focus persists as a
      // "pinned" reading once the pointer leaves. Only meaningful while the
      // plain grid is on screen — gated on the discrete scene id, same
      // boundary the overlay text already snaps on.
      const activeCell = sceneId === 'write' ? store.hover.current ?? store.focus.current : null;
      if (activeCell && activeCell.r < snap.dim && activeCell.c < snap.dim) {
        drawCellHighlight(ctx, layout.matrix.frame, snap.dim, activeCell);
        updateCellTooltip(activeCell, snap, cssW / STAGE_W);
      } else {
        hideCellTooltip();
      }

      // Magnifying loupe — works over every scene, not just the write grid:
      // re-runs the same renderer that just drew the base pass under a
      // clip+scale (draw-loupe.ts), so the magnified view is vector-crisp
      // rather than a blurry pixel sample. Pointer tracking is scene-
      // agnostic (loupePosRef, updated on every pointer move); which frame
      // counts as "active" depends on sceneId.
      const loupePt = loupePosRef.current;
      if (loupePt) {
        let target: Rect | null = null;
        let drawZoomed: (() => void) | null = null;
        if (sceneId === 'write' && layout.matrix.opacity > 0.5) {
          const maxAbs = maxAbsFlat(snap.matrix);
          target = layout.matrix.frame;
          drawZoomed = () => drawMatrix(ctx, displayRef.current, snap.dim, layout.matrix.frame, 1, maxAbs);
        } else if (sceneId === 'synapse' && layout.matrix.opacity > 0.5) {
          const maxAbs = maxAbsFlat(snap.matrix);
          target = layout.matrix.frame;
          drawZoomed = () => drawSynapseGraph(ctx, displayRef.current, snap.dim, layout.matrix.frame, 1, maxAbs);
        } else if (sceneId === 'cliff' && layout.plot.opacity > 0.5) {
          target = layout.plot.frame;
          drawZoomed = () =>
            drawCliffPlot(ctx, layout.plot.frame, 1, snap.dim, cliffHistoryRef.current, sweepBandsRef.current[String(snap.dim)]);
        } else if (sceneId === 'kv-cache' && layout.kvBuffer.opacity > 0.5) {
          target = layout.kvBuffer.frame;
          drawZoomed = () => drawKvBuffer(ctx, layout.kvBuffer.frame, 1);
        }

        if (target && drawZoomed && pointInRect(loupePt, target, 6)) {
          const { displayX, displayY } = drawLoupe(ctx, loupePt.x, loupePt.y, drawZoomed);

          // Numeric readout: only for the matrix, where "which exact number
          // is this cell" is the thing a static heatmap can't answer.
          if (sceneId === 'write') {
            const frame = layout.matrix.frame;
            const col = Math.floor(((loupePt.x - frame.x) / frame.w) * snap.dim);
            const row = Math.floor(((loupePt.y - frame.y) / frame.h) * snap.dim);
            if (row >= 0 && row < snap.dim && col >= 0 && col < snap.dim) {
              const val = snap.matrix[row * snap.dim + col];
              const label = `[${row}, ${col}]  ${val >= 0 ? '+' : ''}${val.toFixed(3)}`;
              // Canvas text is drawn in the same stage-unit space the
              // transform scales, so a literal "12px" here shrinks with the
              // panel exactly like the SVG overlay's fontSize did — see
              // stagePx() in StageOverlay.tsx for the same fix applied
              // there. uiScale is the live cssW/STAGE_W ratio tick() already
              // computes, so this targets a real 12.5 CSS px regardless of
              // panel width.
              const uiScale = cssW / STAGE_W;
              const stageFontPx = Math.round(12.5 / Math.max(uiScale, 0.35));
              const padX = Math.round(7 / Math.max(uiScale, 0.35));
              const padY = Math.round(5 / Math.max(uiScale, 0.35));
              ctx.save();
              ctx.font = `${stageFontPx}px "Departure Mono", monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const chipH = stageFontPx + padY * 2;
              const ty = Math.min(STAGE_H - chipH / 2 - 2, displayY + LOUPE_RADIUS + chipH / 2 + 6);
              const tw = ctx.measureText(label).width + padX * 2;
              ctx.fillStyle = PANEL_FILL;
              const rectX = Math.max(4, Math.min(STAGE_W - tw - 4, displayX - tw / 2));
              ctx.fillRect(rectX, ty - chipH / 2, tw, chipH);
              ctx.strokeStyle = `rgba(255,255,255,0.12)`;
              ctx.lineWidth = 1;
              ctx.strokeRect(rectX + 0.5, ty - chipH / 2 + 0.5, tw - 1, chipH - 1);
              ctx.fillStyle = ON_PANEL;
              ctx.fillText(label, rectX + tw / 2, ty + 1);
              ctx.restore();
            }
          }
        }
      }

      return stillAnimating;
    };

    const loop = createRafLoop(tick);
    loopRef.current = loop;
    loop.request();
    const unsubscribeFrame = scene.onFrame(() => loop.request());
    // Ref-only pokes (cell hover, equation<->diagram term highlight) wake
    // the loop through this separate channel — never through store.subscribe,
    // which is reserved for actual matrix-state commits (see requestRender's
    // doc comment in memory-store.ts).
    const unsubscribeRenderRequest = store.onRenderRequest(() => loop.request());

    return () => {
      unsubscribeFrame();
      unsubscribeRenderRequest();
      loop.stop();
      loopRef.current = null;
    };
    // Reads scene/store fresh via refs every tick — deliberately created once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The panel's live CSS width, for StageOverlay's stagePx() — SVG text
  // sizes are stage units and shrink with the panel exactly like the canvas
  // does, so the overlay needs to know the real width to target actual CSS
  // px sizes. Only updates on genuine resize (ResizeObserver), never per
  // animation frame — cheap, and StageOverlay only re-renders when it moves.
  const [panelWidth, setPanelWidth] = useState(0);

  useStageSurface(
    boxRef,
    visible => loopRef.current?.setActive(visible),
    () => {
      loopRef.current?.request();
      setPanelWidth(boxRef.current?.clientWidth ?? 0);
    }
  );

  const handleFlood = () => {
    for (let i = 0; i < FLOOD_COUNT; i++) {
      store.addPair(randomUnitVector(dim), randomUnitVector(dim), '');
    }
  };

  // Walks n up to 3x the current dimension one write at a time, so the
  // reader watches their own live trace draw out over the precomputed
  // reference band rather than jumping straight there — the point being to
  // see the cliff happen, not just its end state. Self-terminating (checks
  // the store's actual pair count each step, not a closed-over target), so
  // it can't run away if dim or pairs change underneath it.
  const [floodingToCapacity, setFloodingToCapacity] = useState(false);
  // Touch devices have no hover, so the loupe (which normally follows
  // pointermove) never appears there by default. The header's ZOOM chip
  // locks it on: once locked, a tap sets its position (via the new
  // pointerdown handler below, which fires on both a plain tap and a
  // drag-start) and pointerleave no longer clears it, so it survives after
  // the finger lifts. Mouse users can ignore this entirely — hover already
  // works for them.
  const [loupeLocked, setLoupeLocked] = useState(false);
  const handleFloodToCapacity = () => {
    if (floodToTimerRef.current) return;
    setFloodingToCapacity(true);
    const targetN = store.getSnapshot().dim * 3;
    const step = () => {
      const cur = store.getSnapshot();
      if (cur.pairs.length >= targetN || cur.dim * 3 !== targetN) {
        floodToTimerRef.current = null;
        setFloodingToCapacity(false);
        return;
      }
      store.addPair(randomUnitVector(cur.dim), randomUnitVector(cur.dim), '');
      floodToTimerRef.current = window.setTimeout(step, FLOOD_TO_STEP_MS);
    };
    step();
  };

  const handleToggleLoupeLock = () => {
    setLoupeLocked(prev => {
      const next = !prev;
      // Turning it on with no prior pointer position (nothing hovered or
      // tapped yet) — default to the center of whatever's actually on
      // screen right now, so the toggle shows something immediately
      // instead of nothing until the first tap.
      if (next && !loupePosRef.current && layoutRef.current) {
        const { layout, sceneId } = layoutRef.current;
        const frame = sceneId === 'cliff' ? layout.plot.frame : sceneId === 'kv-cache' ? layout.kvBuffer.frame : layout.matrix.frame;
        if (frame.w > 0 && frame.h > 0) {
          loupePosRef.current = { x: frame.x + frame.w / 2, y: frame.y + frame.h / 2 };
        }
      }
      if (!next) loupePosRef.current = null;
      loopRef.current?.request();
      return next;
    });
  };

  // Cell inspector interaction — mutates store.hover/focus refs directly and
  // wakes the render loop for one frame; never touches React state, so
  // moving the pointer across the grid never re-renders this component (see
  // memory-store.ts's three-tier rule). Only live during the 'write' scene,
  // where the plain heatmap grid (not the KV buffer or synapse graph) is on
  // screen — everywhere else these are no-ops so Tab/arrow keys fall through
  // to normal page navigation instead of trapping focus on an inert canvas.
  //
  // Deliberately NOT `scene.scene` here: that's hysteresis-committed React
  // state (HYSTERESIS=0.06 in useScrollScene), while tick() gates its own
  // drawing on the raw, uncommitted sceneId resolveStageLayout derives from
  // scenePosition directly. The two disagree for a real (if narrow) range
  // near a scene boundary — reachable not just by scrolling but by a layout
  // shift alone (e.g. opening a taller MemoryLab tab changes the track's
  // total height, which re-maps scroll fraction -> scenePosition at the same
  // scrollY). Read the same raw source tick() uses so a handler that thinks
  // it's live never fires into a tick() that's already decided it isn't.
  const isWriteSceneNow = () => resolveStageLayout(scene.frameRef.current.scenePosition).sceneId === 'write';

  const canvasPointToStage = (offsetX: number, offsetY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.clientWidth === 0) return null;
    const scale = canvas.clientWidth / STAGE_W;
    return { x: offsetX / scale, y: offsetY / scale };
  };

  const canvasPointToCell = (offsetX: number, offsetY: number): GridCell | null => {
    const pt = canvasPointToStage(offsetX, offsetY);
    if (!pt) return null;
    const frame = MATRIX_TARGET;
    if (pt.x < frame.x || pt.x >= frame.x + frame.w || pt.y < frame.y || pt.y >= frame.y + frame.h) return null;
    const snapDim = store.getSnapshot().dim;
    const c = Math.floor(((pt.x - frame.x) / frame.w) * snapDim);
    const r = Math.floor(((pt.y - frame.y) / frame.h) * snapDim);
    if (r < 0 || r >= snapDim || c < 0 || c >= snapDim) return null;
    return { r, c };
  };

  // Equation<->diagram term link, the "vice versa" direction: hovering the
  // grid interior means M/S (the whole matrix); hovering its left or top
  // gutter — the same GUTTER width the write-beam animation uses — means v
  // or k respectively. Kept as a plain zone test (not per-cell) since a
  // single (r,c) can't disambiguate "the user means the row axis" from "the
  // whole matrix".
  const canvasPointToAxis = (offsetX: number, offsetY: number): TermAxis | null => {
    const pt = canvasPointToStage(offsetX, offsetY);
    if (!pt) return null;
    const frame = MATRIX_TARGET;
    const inRows = pt.y >= frame.y && pt.y < frame.y + frame.h;
    const inCols = pt.x >= frame.x && pt.x < frame.x + frame.w;
    if (pt.x >= frame.x - GUTTER && pt.x < frame.x && inRows) return 'v';
    if (pt.y >= frame.y - GUTTER && pt.y < frame.y && inCols) return 'k';
    if (inRows && inCols) return 'm';
    return null;
  };

  const cellsEqual = (a: GridCell | null, b: GridCell | null) => a === b || (!!a && !!b && a.r === b.r && a.c === b.c);

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Loupe tracking is scene-agnostic — updates regardless of which scene
    // is active, unlike the cell inspector below (write-scene only).
    const { offsetX, offsetY } = e.nativeEvent;
    loupePosRef.current = canvasPointToStage(offsetX, offsetY);
    loopRef.current?.request();

    if (!isWriteSceneNow()) return;
    const cell = canvasPointToCell(offsetX, offsetY);
    const axis = canvasPointToAxis(offsetX, offsetY);
    let woke = false;
    if (!cellsEqual(store.hover.current, cell)) {
      store.hover.current = cell;
      woke = true;
    }
    if (store.termHighlight.current !== axis) {
      store.termHighlight.current = axis;
      woke = true;
    }
    // requestRender(), not loopRef directly: termHighlight has DOM listeners
    // too (every mounted EquationTerm subscribes via onRenderRequest), and
    // that channel is the only thing that reaches them — loopRef only wakes
    // this component's own canvas loop.
    if (woke) store.requestRender();
  };

  // A plain tap fires pointerdown/pointerup with no pointermove between
  // them — handleCanvasPointerMove alone would never see it. This covers
  // that case (and drag-starts, harmlessly redundantly) so a tap always
  // moves the loupe when it's locked on.
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const pt = canvasPointToStage(offsetX, offsetY);
    if (pt) {
      loupePosRef.current = pt;
      loopRef.current?.request();
    }
  };

  const handleCanvasPointerLeave = () => {
    // Locked (touch path): keep the loupe showing wherever it last was
    // rather than clearing it the instant the finger lifts.
    if (!loupeLocked) {
      loupePosRef.current = null;
      loopRef.current?.request();
    }

    let woke = false;
    if (store.hover.current) {
      store.hover.current = null;
      woke = true;
    }
    if (store.termHighlight.current) {
      store.termHighlight.current = null;
      woke = true;
    }
    if (woke) store.requestRender();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isWriteSceneNow()) return;
    const cell = canvasPointToCell(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    if (!cell) return;
    const cur = store.focus.current;
    store.focus.current = cur && cur.r === cell.r && cur.c === cell.c ? null : cell;
    store.requestRender();
  };

  // Deliberately no onFocus handler: a plain Tab landing on the canvas does
  // NOT pin a cell — only an explicit click or the first arrow-key press
  // does. Auto-selecting a cell on focus previously raced with the click
  // toggle below (focus fires before click on an unfocused element, so the
  // toggle saw its own just-set state and immediately flipped back off).

  const handleCanvasKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!isWriteSceneNow()) return;
    if (e.key === 'Escape') {
      store.focus.current = null;
      store.termHighlight.current = null;
      loupePosRef.current = null;
      store.requestRender();
      return;
    }
    const snapDim = store.getSnapshot().dim;
    const cur = store.focus.current ?? { r: 0, c: 0 };
    let next: GridCell | null = null;
    if (e.key === 'ArrowUp') next = { r: Math.max(0, cur.r - 1), c: cur.c };
    else if (e.key === 'ArrowDown') next = { r: Math.min(snapDim - 1, cur.r + 1), c: cur.c };
    else if (e.key === 'ArrowLeft') next = { r: cur.r, c: Math.max(0, cur.c - 1) };
    else if (e.key === 'ArrowRight') next = { r: cur.r, c: Math.min(snapDim - 1, cur.c + 1) };
    if (!next) return;
    e.preventDefault();
    store.focus.current = next;
    // Keyboard navigation is always "inside the matrix" — same 'm' a mouse
    // hovering the grid interior sets, so equation terms react identically
    // regardless of input method.
    store.termHighlight.current = 'm';
    // The loupe follows keyboard focus too, not just the pointer — write is
    // the only scene focus/arrow-keys apply to, and its frame is always
    // exactly MATRIX_TARGET (see the doc comment on isWriteSceneNow above).
    const frame = MATRIX_TARGET;
    const cellW = frame.w / snapDim;
    const cellH = frame.h / snapDim;
    loupePosRef.current = { x: frame.x + (next.c + 0.5) * cellW, y: frame.y + (next.r + 0.5) * cellH };
    store.requestRender();
  };

  return (
    <div
      ref={scene.trackRef}
      className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1fr] gap-8 lg:gap-16 max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24"
    >
      <div className="order-2 lg:order-1 min-w-0 max-w-2xl">
        <section id="problem" className="lg:min-h-[90svh] flex flex-col justify-center py-8">
          <SectionHeader
            eyebrow="01 The Problem"
            title="Transformers Remember Everything. That's Expensive."
            icon={<IsoIllustration name="kv-cache" size={80} className="hidden sm:block shrink-0 -mt-1" />}
            className="mb-6"
          />
          <p className="text-base text-ink-muted leading-relaxed mb-4">
            Standard Transformers store every past token in a key–value cache that grows linearly with context
            length. More context = more memory = more cost.
          </p>
          <p className="text-base text-ink-muted leading-relaxed mb-8">
            What if instead we compressed everything into a <strong className="text-ink">fixed-size matrix</strong>?
            Memory stays constant — O(1) — regardless of sequence length. But there's a cost, which the next section
            makes precise.
          </p>

          <div>
            <h3 className="text-xl font-display text-ink mb-3">The Fundamental Tradeoff</h3>
            <Panel className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-elevated/80 border-b border-border/80">
                    <th className="py-3 px-4 text-xs font-semibold text-ink">Property</th>
                    <th className="py-3 px-4 text-xs font-semibold text-ink">KV-Cache (Transformer)</th>
                    <th className="py-3 px-4 text-xs font-semibold text-ink">Fixed-Size Recurrent State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink">Memory per step</td>
                    <td className="py-3 px-4 text-ink">Grows: O(n)</td>
                    <td className="py-3 px-4 text-memory font-semibold">Constant: O(1)</td>
                  </tr>
                  <tr className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink">Recall fidelity</td>
                    <td className="py-3 px-4 text-truth font-semibold">Perfect — everything stored</td>
                    <td className="py-3 px-4 text-ink">Degrades under load</td>
                  </tr>
                  <tr className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink">Inference cost</td>
                    <td className="py-3 px-4 text-ink">Grows with context</td>
                    <td className="py-3 px-4 text-memory font-semibold">Constant</td>
                  </tr>
                  <tr className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink">Failure mode</td>
                    <td className="py-3 px-4 text-ink">OOM / quadratic slowdown</td>
                    <td className="py-3 px-4 text-interference font-medium">Interference — memories corrupt each other</td>
                  </tr>
                </tbody>
              </table>
            </Panel>
            <p className="text-xs text-ink-muted italic border-t border-border/70 pt-3 mt-4">
              This is the core tradeoff this explainer teaches. BDH (
              <a
                href="https://arxiv.org/abs/2509.26507"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink hover:text-memory underline not-italic"
              >
                arXiv:2509.26507
              </a>
              ) and BDH-CQ (
              <a
                href="https://arxiv.org/abs/2608.09888"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink hover:text-memory underline not-italic"
              >
                arXiv:2608.09888
              </a>
              ) implement the fixed-size approach — Section 3 explains how.
            </p>
          </div>
        </section>

        <section id="memory" className="lg:min-h-[160svh] flex flex-col justify-center py-8 gap-8">
          <div>
            <SectionHeader
              eyebrow="02 // THE MECHANISM"
              title="Memory Lab: Outer-Product Associative Memory"
              icon={<IsoIllustration name="memory-bank" size={80} className="hidden sm:block shrink-0 -mt-1" />}
              lede="Store key→value associations in a fixed-size d×d matrix using rank-1 Hebbian outer products. Watch the write happen on the right — then read them back out and observe directly where and why interference begins."
              className="mb-6"
            />
          </div>
          <MemoryLab />
        </section>

        <section id="bdh" className="lg:min-h-[150svh] flex flex-col justify-center py-8 gap-8">
          <div>
            <SectionHeader
              eyebrow="03 BDH Connection"
              title="How BDH and BDH-CQ Use This Mechanism"
              icon={<IsoIllustration name="synapse-lattice" size={80} className="hidden sm:block shrink-0 -mt-1" />}
              lede={
                <>
                  The outer-product write you just used <em>is</em> BDH's core memory mechanism. On the right, the
                  same live matrix redraws as the bipartite synaptic graph BDH's own architecture describes — key and
                  value units connected by the associations you've written.
                </>
              }
              className="mb-6"
            />
          </div>
          <BDHModule />
        </section>

        <section id="interference" className="lg:min-h-[110svh] flex flex-col justify-center py-8 gap-6">
          <div>
            <SectionHeader
              eyebrow="04 The Breaking Point"
              title="When Memory Overflows: The Interference Cliff"
              icon={<IsoIllustration name="overflow" size={80} className="hidden sm:block shrink-0 -mt-1" />}
              className="mb-6"
            />
            <p className="text-base text-ink-muted leading-relaxed mb-4">
              Our claim says recall degrades "when the number of associations exceeds the memory's rank." The dashed
              band on the right is the precomputed sweep for d = {dim}; the solid line is built live from every write
              you've made across this whole page. Flood it to watch your own trace draw over the reference band.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleFloodToCapacity}
                disabled={floodingToCapacity}
                variant="primary"
                className="font-mono disabled:cursor-wait"
              >
                {floodingToCapacity ? 'Flooding…' : `Flood to 3×d (${dim * 3})`}
              </Button>
              <Button onClick={handleFlood} variant="ghost" className="font-mono">
                Flood (+{FLOOD_COUNT})
              </Button>
              <Button onClick={() => store.clear()} variant="danger" className="font-mono">
                Reset
              </Button>
              <span className="text-xs font-mono text-ink-muted">
                d = {dim}, n = {pairCount}
              </span>
            </div>
          </div>
          <BreakingPoint />
        </section>
      </div>

      <div className="order-1 lg:order-2">
        <div className="relative w-full max-w-xl mx-auto lg:max-w-none lg:sticky lg:top-24 rounded-2xl overflow-hidden border border-border/70 bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]">
          {/* Header: a labeled scene stepper (replaces the old bare dot
              rail — "reads as decoration" per the earlier design pass) plus
              the live d/n readout, so the panel identifies itself as an
              instrument with real state, not a static graphic. */}
          <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 bg-surface-elevated/95 border-b border-border/70">
            <nav aria-label="Jump to a Stage scene" className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
              {SCENES.map((s, i) => {
                const active = scene.scene === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scene.scrollToScene(s.id)}
                    title={s.label}
                    aria-label={`Jump to: ${s.label}`}
                    aria-current={active ? 'true' : undefined}
                    className={`shrink-0 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide px-2.5 py-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-memory/70 ${
                      active ? 'bg-memory text-canvas font-semibold' : 'text-ink-muted hover:text-ink hover:bg-ink/[0.08]'
                    }`}
                  >
                    <span className={active ? 'text-canvas/70' : 'text-ink-faint'}>{String(i + 1).padStart(2, '0')}</span>
                    {s.navLabel}
                  </button>
                );
              })}
            </nav>
            <div className="flex items-center gap-2 shrink-0 pl-1">
              {/* Touch devices have no hover, so the loupe never appears
                  there by default — this locks it on and lets a tap move
                  it (see handleCanvasPointerDown/handleToggleLoupeLock).
                  Harmless for mouse users, who already get the loupe from
                  hover alone. */}
              <button
                type="button"
                onClick={handleToggleLoupeLock}
                aria-pressed={loupeLocked}
                title={loupeLocked ? 'Turn off the magnifying loupe' : 'Turn on the magnifying loupe (for touch — tap the diagram to move it)'}
                className={`font-mono text-[11px] uppercase tracking-wide px-2.5 py-1.5 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-memory/70 ${
                  loupeLocked ? 'bg-memory text-canvas border-memory' : 'text-ink-muted border-border/80 hover:text-ink hover:bg-ink/[0.08]'
                }`}
              >
                Zoom
              </button>
              <span className="font-mono text-[11px] text-ink-muted">
                d={dim} &middot; n={pairCount}
              </span>
            </div>
          </div>

          {/* Artifact well — the aspect-locked surface syncSurface's canvas
              transform assumes (its scale is derived from width alone, see
              lib/canvas.ts), kept as its own box independent of the header/
              caption bars above and below it so that invariant never breaks.
              Warm canvas ground + a faint grid so empty space between scenes
              reads as graph paper, not a void. */}
          <div ref={boxRef} className="relative w-full aspect-[1000/640] bg-canvas bg-grid-pattern overflow-hidden">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-memory/70 focus-visible:ring-inset"
              tabIndex={0}
              aria-label={`Memory matrix, ${dim} by ${dim} cells. While this section is on screen: move the pointer or use arrow keys to inspect a cell's value and which writes contributed to it; click or press Escape to pin or unpin a cell.`}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerLeave={handleCanvasPointerLeave}
              onClick={handleCanvasClick}
              onKeyDown={handleCanvasKeyDown}
            />
            <StageOverlay
              sceneId={scene.scene}
              dim={dim}
              pairCount={pairCount}
              meanRecall={meanRecall}
              maxAbs={maxAbs}
              panelWidth={panelWidth}
            />
            <div
              ref={tooltipRef}
              hidden
              aria-live="polite"
              aria-atomic="true"
              className="absolute z-40 pointer-events-none bg-surface-elevated/95 backdrop-blur-sm text-white rounded-lg px-3 py-2 shadow-xl border border-white/10 min-w-[170px] max-w-[220px]"
            />
          </div>

          {/* Caption bar — one line naming what's actually on screen, so the
              artifact never has to be decoded from the diagram alone. Keyed
              on the hysteresis-committed scene (same source StageOverlay
              uses), not the raw scroll position, so it changes exactly when
              the diagram itself commits to the new scene. */}
          <div className="px-3 sm:px-4 py-2 border-t border-border/70 bg-surface-elevated/60">
            <p className="text-[11px] sm:text-xs text-ink-muted leading-snug m-0">
              {SCENES.find(s => s.id === scene.scene)?.caption}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
