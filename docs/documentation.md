# Project Documentation: Recurrent Memory Explainer

This document outlines the architecture, user interface (UI), and core logic ("backend") for the DataForge 2026 Pathway Track hackathon submission.

Our goal was to build a highly interactive, beautifully designed explainer that demonstrates how a fixed-size recurrent memory (like the one used in BDH and BDH-CQ) learns from demonstrations and eventually forgets due to interference.

> **Authoritative artifact:** the production **React 19 + TypeScript + Vite + Tailwind** application in `react-app/` is what is deployed and judged. A vanilla HTML/CSS/JS prototype also lives at the repo root (`index.html`, `js/`, `css/`) — it is retained only as a low-dependency reference and is described separately in [Section 6](#6-legacy-prototype-reference-only). Everything below (Sections 1–5) describes `react-app/`.

---

## 1. Architecture Overview

To meet the strict "no sign-in", "fast feedback", and "cold start" constraints of the hackathon, the project is architected as a **static single-page application** with no server-side component.

* **Frontend:** React 19 + TypeScript, built with Vite and styled with Tailwind CSS. Deployed as a static bundle to GitHub Pages (`.github/workflows/deploy.yml`).
* **"Backend" / Substrate:** Core math and logic execute live in the browser via a pure, DOM-free TypeScript module (`react-app/src/lib/memory-math.ts`), plus a Float32Array hot-path mirror (`memory-math-flat.ts`) for the 60fps render loop.
* **Precomputation:** Python scripts run ahead of time to generate heavy Monte Carlo simulations (interference sweeps) and ARC-style task data, shipped as static JSON under `data/` (mirrored into `react-app/public/data/` for the build).
* **Presentation:** a single pinned scrollytelling instrument — the **Stage** (`react-app/src/stage/`) — replaces the earlier "one card per concept" layout. One shared canvas+SVG matrix morphs through four scenes as the reader scrolls, driven by one shared external store rather than each section owning a disconnected copy of the state. See Section 3.

---

## 2. Core Logic & "Backend"

Because this is a static site, the "backend" consists of three parts: the offline Python data pipelines, the live TypeScript mathematical model, and the store that holds its live state.

### A. The Real Substrate (`react-app/src/lib/memory-math.ts`)
This is the heart of the interactive explainer. It implements the exact mathematical mechanism used by BDH for synaptic memory (arXiv:2509.26507) and BDH-CQ for in-context learning (arXiv:2608.09888). Pure functions, zero DOM dependencies, and its original exported signatures never change — README and in-app footnotes point at them by name.
* **Hebbian Write:** `M ← M + v · kᵀ` (Outer-product accumulation) — `writeAssociation()`
* **Linear Readout:** `v̂ = M · q` — `readAssociation()`
* **Learning rate & decay:** `M ← (1−λ)M + η·v·kᵀ` — `writeWithDecay()`, mathematically identical to `writeAssociation()` at η=1, λ=0.
* **Exact-angle key construction:** `makeKeyAtAngle(kRef, θ, rng)` — Gram-Schmidt blend of `kRef` and a random orthogonal component, so `k(θ)·kRef = cos θ` exactly, not approximately. Powers the orthogonality-angle sandbox (Section 3).
* **Per-cell write breakdown:** `cellContributions(pairs, i, j)` — one `v_m[i]·k_m[j]` term per stored pair, for the cell inspector.
* **ARC grid encode/decode:** `encodeGrid(grid, dim, seed)` (seeded random-projection embedding) and `decodeGrid(v̂, candidates)` (nearest-neighbour cosine match) — power the playable ARC sandbox, explicitly *not* a model of real BDH-CQ inference.
* **Evaluation:** `cosineSimilarity()`, plus a seeded Mulberry32 RNG (`createRng`) and Box-Muller unit-vector sampler (`randomUnitVector`) for reproducible trials.
* **Execution:** every write anywhere on the page — Memory Lab's controls, BDHModule's decay control, the Stage's Flood button, the ARC sandbox — funnels through the *same* store (below), so this code runs live and the shared matrix is always internally consistent.

### B. The Shared Store (`react-app/src/state/memory-store.ts`)
A plain external store (`createMemoryStore`, `useSyncExternalStore`-based), not React context+reducer — a context value would re-render every consumer (controls, ledger, capacity meter, Stage canvas) on every single write. `useMemorySelector` lets each consumer subscribe to only the slice it needs.

Three-tier state rule used throughout the Stage codebase:
1. **React state** (`useMemorySelector`: `dim`, `pairs`, `matrix`, `rev`) — changes at human frequency (clicks), fine to re-render on.
2. **MotionValue** (scroll/animation progress, in `useScrollScene`) — never touches the store.
3. **Ref** (`hover`, `focus`, `termHighlight`) — mutated directly by pointer/keyboard handlers, read directly by the canvas render loop. Never goes through `setState`, so a 120Hz mousemove or a scroll-driven canvas hover never re-renders React. A separate `requestRender()`/`onRenderRequest()` channel wakes listeners for these ref-only pokes without touching `commit()` — routing them through the data-changed path would, for example, push spurious duplicate points onto the interference-cliff scene's write history on every hover.

### C. Python Precomputation Scripts (`scripts/`)
Heavy computational tasks are precomputed to ensure the UI remains 60fps.
* **`precompute_interference.py`**: Runs Monte Carlo trials simulating memory overload across dimensions `d ∈ {4, 8, 16, 32, 64}` (20 trials/point). Outputs statistical means, standard deviations, and capacity-ratio curves to `data/interference_sweep.json`, rendered by `BreakingPoint.tsx`.
* **`precompute_bdh_demo.py`**: Generates original, ARC-style toy grid tasks (three rules: fill-enclosed-region, horizontal-mirror, count-distinct-colors) used in the BDH-CQ walkthrough. Outputs to `data/bdh_cq_demo_tasks.json`, loaded and stepped through by `BDHModule.tsx`.

---

## 3. The Stage: Pinned Scrollytelling Instrument (`react-app/src/stage/`)

`Stage.tsx` is the persistent, sticky canvas+SVG instrument on the right side of the page while the reader scrolls through four narrative sections on the left. One live `d×d` matrix — the same shared store from Section 2B — morphs between four scenes rather than each section drawing its own disconnected chart.

### A. Scenes (`state/scene-spec.ts`, `stage/scenes/`)
| Scene | Narrative section | What's shown |
| :--- | :--- | :--- |
| `kv-cache` | `#problem` | The KV-cache buffer growing vs. the fixed-size matrix appearing |
| `write` | `#memory` | The live `d×d` heatmap; the write-beam animation plays here whenever any control anywhere writes a pair |
| `synapse` | `#bdh` | The same matrix redrawn as a bipartite key→value graph |
| `cliff` | `#interference` | A live recall-vs-n plot built from every write made across the whole page |

`useScrollScene` (`hooks/`) maps scroll position to a continuous `scenePosition` MotionValue (zero React renders) and a **hysteresis-committed** discrete `sceneId` (a 0.06 deadband, so parking exactly on a boundary can't flicker). `resolveLayout.ts` blends each scene's `layoutFor(p)` output — matrix frame, opacity, gutter, graph/grid crossfade — for the continuous, uncommitted position; renderers in `stage/render/` (`draw-matrix`, `draw-beams`, `draw-graph`, `draw-plot`, `draw-kv-buffer`, `draw-cell-highlight`, `draw-term-highlight`) read that blended layout every frame. `hooks/useRafLoop.ts` parks at rest — zero pending `requestAnimationFrame` callbacks until something (a write, a scroll tick, a hover) calls `.request()`.

### B. Interactive layers on the canvas
* **Cell inspector** — hover, click-to-pin, or arrow-key-navigate any cell in the `write` scene; a tooltip shows its exact value and the top contributing writes (via `cellContributions`), built with DOM calls rather than `innerHTML` since pair labels come from free-text user input. Announces via its own `aria-live="polite"` region.
* **Equation↔diagram linking** — hovering/focusing a `v`, `k`/`q`, or `M`/`S` term in MemoryLab's or BDHModule's equations (the shared `EquationTerm` component) highlights the matching region on the canvas (row gutter, column gutter, or the whole matrix), and hovering that region on the canvas highlights every matching term back, anywhere on the page.
* **Scene rail** — a small dot-per-scene nav overlaid on the panel; each dot calls `scrollToScene(id)` (jumps to the *middle* of that scene's scroll range, not its start boundary — landing exactly on a boundary sits inside the hysteresis deadband and never commits).

### C. Absorption: what moved into the Stage vs. what stayed as narrative content
The pre-redesign layout had one card per component, each drawing its own chart against its own disconnected state. The Stage absorbed the *visualizations*; each component kept its *real* narrative content:

| Component | Visualization now lives in the Stage | What stays in the component |
| :--- | :--- | :--- |
| `MemoryLab.tsx` | `write` scene's heatmap | Retrieval Fidelity ledger, Step-by-Step Readout walkthrough, Custom Input Sandbox, Orthogonality Angle (θ) sandbox |
| `BDHModule.tsx` | `synapse` scene's bipartite graph | 4-step precomputed walkthrough, η/λ learning-rate & decay control, "Try It Yourself" playable ARC sandbox |
| `BreakingPoint.tsx` | `cliff` scene's live recall-vs-n plot | The precomputed multi-dimensional interference sweep (a distinct evidence category — see Section 5) |
| `ProblemComparison.tsx` (deleted) | `kv-cache` scene | Its tradeoff table and prose now live directly in `Stage.tsx`'s `#problem` section |

### D. New interactive controls (all real math, none decorative)
* **θ orthogonality-angle slider** (Memory Lab) — constructs a key at an exact angle from a stored key via `makeKeyAtAngle`, live-simulating the write's effect on recall before it's committed.
* **η/λ learning-rate & decay** (BDH Module) — genuinely re-routes the write path through `writeWithDecay`; default η=1, λ=0 is identical to a plain write.
* **Playable ARC sandbox** (BDH Module, "Try It Yourself") — pick a transform rule, write two demonstrations, author a test grid by clicking cells, and read the matrix's nearest-neighbour prediction. Always labelled "illustration — not live BDH-CQ inference," per the rubric's evidence-discipline requirement.

---

## 4. Design System, A11y, and Performance

### A. Design System
* **Aesthetics:** a warm, editorial "paper" palette by default; the Stage and its live charts rescope the same CSS custom properties to a dark "instrument" palette (`.instrument-panel`, `.retro-terminal-frame` in `index.css`) — one token set, two themes, no component-level branching.
* **Color Coding:** a semantic palette carried through every chart and badge — memory/state (`text-memory`, blue/cyan), interference (`text-interference`, amber/red), ground truth (`text-truth`, emerald), plus `synapse` (purple, BDH/synaptic) and `data` (amber-brown, precomputed/provenance).
* **Typography:** Fraunces (headings), Inter (body), Departure Mono (matrices, numbers, code).
* **Isometric spot icons:** `components/illustrations/` (glassy isometric scene illustrations) and `components/ui/GlassIcon.tsx` (squircle-glass icon wrapper for lucide glyphs) are the only places besides these that carry real visual weight.

### B. Accessibility
* **Keyboard path:** the scene rail (mouse or keyboard) and the cell inspector's arrow-key cell navigation both work without a pointer; canvas focus never traps Tab/arrow keys outside the `write` scene.
* **`aria-live` announcements:** `WriteAnnouncer.tsx` is one always-mounted region that announces every write or clear anywhere on the page (debounced so a 20-pair Flood coalesces into one announcement, not twenty); the cell inspector's tooltip carries its own separate `aria-live` region.
* **`prefers-reduced-motion`:** the CSS blanket rule in `index.css` handles CSS `@keyframes`/`transition`, but cannot reach `motion/react` components, which drive values via rAF/WAAPI instead. `<MotionConfig reducedMotion="user">` wraps the whole app (in `App.tsx`) for transform-based animations; Hero's plain opacity-only `repeat: Infinity` pulses (which `MotionConfig`'s reduced-motion handling deliberately leaves alone) are gated explicitly via `usePrefersReducedMotion()`.

### C. Performance
* KaTeX: the two constant equations in `CheckUnderstanding.tsx` are pre-rendered at build time (`lib/prerendered-katex.ts`) rather than calling `katex.renderToString` at runtime — the runtime `katex` package moved to a devDependency, used only to regenerate that file if the equations change.
* Citations/Readme modals: instead of baking the markdown source as a template literal and re-parsing it at runtime with `marked` + a KaTeX pass, they `<iframe>` the already-prerendered `public/citations.html` / `public/readme.html` (generated by `scripts/generate_readme_html.py`) — a real page load, so its own KaTeX auto-render script runs correctly. Both modals are lazy-loaded (`React.lazy` + `Suspense` in `App.tsx`) so their code downloads only when a reader actually opens one.
* `vite.config.ts` splits `react`/`react-dom`/`scheduler` into a separate `vendor` chunk so app-code redeploys don't invalidate the browser's cache of React itself.
* Net effect of the above: initial JS dropped from a single ~791KB (~240KB gzip) chunk to ~284KB app code + ~194KB vendor (~83KB + ~61KB gzip respectively), with modal code (~2KB each) deferred entirely.

---

## 5. Evidence Labelling Strategy

Following the strict hackathon rubric, every piece of data and visualization in the UI is clearly labeled to distinguish between:
* **Real Substrate:** Live math running in the browser (Memory Lab, the Stage's live matrix and cliff plot, the θ/η/λ sandboxes, the cell inspector).
* **Precomputed:** Python simulations and toy task data loaded via JSON (Interference Sweep, BDH-CQ walkthrough grids).
* **Illustration:** Conceptual walkthroughs explicitly badged "illustration" (BDH-CQ ARC grids and the playable ARC sandbox — original tasks, not the ARC-AGI dataset, and not live BDH-CQ inference).
* **Self-Reported Benchmark:** Claims taken from the official papers (e.g., the 29.5% pass@2 claim), labeled with its partially-independent-audit status in the Evidence Panel.

This transparent labeling protects the submission from rubric penalties regarding "Evidence Discipline".

---

## 6. Legacy Prototype (Reference Only)

The repository root also contains a standalone vanilla HTML/JS/CSS implementation, kept for low-dependency inspection and not part of the judged artifact:

* **Frontend:** Vanilla HTML, CSS, and JS (`index.html`, `css/style.css`).
* **"Backend" / Substrate:** `js/memory-model.js` implements the same outer-product write / linear readout mechanism as `memory-math.ts`.
* **Modules:** `js/app.js` and `js/visualizations.js` (canvas charts for the KV-cache comparison and Memory Lab heatmap), `js/bdh-module.js` (step-by-step ARC grid walkthrough), `js/scroll-controller.js` (`IntersectionObserver`-driven fade-ins and dot navigation).
* **Run it:** `python3 -m http.server 8080` from the repository root, then visit `http://localhost:8080/`.

Any change to the associative-memory mechanism should be made in `react-app/src/lib/memory-math.ts` first; the legacy prototype is not required to stay in sync.
