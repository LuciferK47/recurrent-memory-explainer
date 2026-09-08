# Recurrent Memory Explainer — LLM Context & System Guide

> **Target AI System:** Anthropic Claude (and all Agentic / Pair-Programming LLMs)  
> **Repository:** `LuciferK47/recurrent-memory-explainer`  
> **Event:** DataForge 2026 × Pathway Track  
> **Submission Track:** Explain the Frontier — In-Context Learning with Recurrent Memory  
> **Source of Truth:** [docs/fact_sheet.md](docs/fact_sheet.md)

---

## 1. Executive Summary & Central Claim

This repository hosts an interactive pedagogical explainer and mathematical substrate demonstrating how **fixed-size recurrent associative memory** operates, absorbs in-context demonstrations without gradient descent, and degrades predictably when its capacity limit is exceeded.

### The Central Locked Claim
> *"A fixed-size recurrent memory can absorb key–value associations from demonstrations and recall them accurately — until the number of associations exceeds the memory's rank, at which point recall degrades through interference in a predictable, measurable way."*

### Key Comparison
- **Standard Transformers:** Maintain an unbounded Key-Value (KV) cache scaling linearly with context length ($O(n)$ space complexity per sequence during inference).
- **Recurrent / Associative Memory (BDH / BDH-CQ):** Compresses associations into a fixed $d \times d$ synaptic weight matrix, achieving constant memory ($O(1)$ space complexity per sequence during inference).
- **Fundamental Trade-off:** $O(1)$ memory guarantees bounded compute and footprint, but imposes a hard capacity cliff governed by dimension $d$ and key orthogonality, causing cross-talk interference when $N > d$.

---

## 2. Repository Structure & Artifact Hierarchy

```
Pathway_IITKGP/
├── CLAUDE.md                      # THIS FILE: Comprehensive LLM System & Context Guide
├── README.md                      # Public GitHub overview, quickstart, and rubric ledger
├── LICENSE                        # MIT License
├── concept_summary.pdf            # 1-page executive summary PDF deliverable
│
├── react-app/                     # ★ AUTHORITATIVE PRODUCTION DELIVERABLE (React 19 + Vite)
│   ├── index.html                 # React entry template (loads KaTeX CSS from CDN)
│   ├── package.json               # Scripts & dependencies (lucide-react, motion, tailwindcss; katex is a devDependency only — see lib/prerendered-katex.ts)
│   ├── vite.config.ts             # Vite config: base path + manualChunks vendor (react/react-dom/scheduler) split
│   ├── tsconfig.json              # TypeScript configuration
│   ├── public/
│   │   ├── citations.html         # Prerendered standalone citations mirror — CitationsModal iframes this
│   │   ├── readme.html            # Prerendered standalone README mirror — ReadmeModal iframes this
│   │   └── data/                  # Mirror of repo-root data/*.json for the build
│   └── src/
│       ├── main.tsx               # DOM mount point
│       ├── App.tsx                # App shell: MotionConfig(reducedMotion="user") + MemoryStoreProvider, lazy-loaded modals
│       ├── index.css              # Tailwind tokens (paper + dark "instrument" palettes), font imports, prefers-reduced-motion CSS rule
│       ├── lib/
│       │   ├── memory-math.ts       # Pure mathematical substrate (zero DOM dependencies) — signatures never change
│       │   ├── memory-math-flat.ts  # Float32Array hot-path mirror for the Stage's render loop
│       │   ├── prerendered-katex.ts # Build-time-rendered KaTeX HTML for CheckUnderstanding's two constant equations
│       │   ├── layout.ts            # StageLayout type, MATRIX_TARGET/PLOT_TARGET, lerpLayout
│       │   ├── canvas.ts            # STAGE_W/STAGE_H stage-unit coordinate system, syncSurface (DPR-aware backing store)
│       │   ├── colormap.ts          # Heatmap cell color-from-value function
│       │   ├── easing.ts            # Shared easing/interpolation helpers
│       │   ├── iso.ts               # Isometric-projection math for the spot illustrations
│       │   └── preset-labels.ts     # Preset key→value concept labels for random-pair generation
│       ├── state/
│       │   ├── memory-store.ts      # External store (createMemoryStore/useSyncExternalStore) — see §3.6
│       │   └── scene-spec.ts        # SCENES registry (kv-cache/write/synapse/cliff) + weighted scroll bounds
│       ├── hooks/
│       │   ├── useScrollScene.ts        # scroll position -> {continuous scenePosition MotionValue, hysteresis-committed sceneId}
│       │   ├── useRafLoop.ts            # requestAnimationFrame loop that parks at rest
│       │   ├── useStageSurface.ts       # ResizeObserver + IntersectionObserver + document-visibility gate
│       │   └── usePrefersReducedMotion.ts
│       ├── stage/                   # The pinned scrollytelling instrument — see §3.7
│       │   ├── Stage.tsx            # Render loop, cell inspector, loupe pointer tracking, equation<->diagram linking, header scene-stepper, caption bar, narrative column
│       │   ├── StageOverlay.tsx     # Crisp SVG text overlay (axis ticks, colorbar, legends), keyed on the discrete sceneId
│       │   ├── resolveLayout.ts     # Blends each scene's layoutFor(p) for the continuous scroll position
│       │   ├── scenes/              # kv-cache.ts, write.ts, synapse.ts, cliff.ts — layoutFor(p): StageLayout
│       │   └── render/              # draw-matrix, draw-beams, draw-graph, draw-plot, draw-kv-buffer, draw-cell-highlight, draw-term-highlight, draw-loupe, write-anim
│       └── components/
│           ├── Navbar.tsx         # Floating frosted-glass pill navbar with section anchors
│           ├── Hero.tsx           # Signature Hebbian synaptic junction interactive vector visualization
│           ├── MemoryLab.tsx      # Ledger, Step-by-Step Readout, Custom Input Sandbox, Orthogonality Angle (θ) sandbox — heatmap lives in the Stage now
│           ├── BDHModule.tsx      # 4-step precomputed walkthrough + η/λ decay control + "Try It Yourself" ARC sandbox
│           ├── ArcSandbox.tsx     # Playable ARC-style sandbox: encodeGrid/decodeGrid nearest-neighbour illustration
│           ├── BreakingPoint.tsx  # Precomputed multi-dim interference sweep only — live Flood chart moved to the Stage's cliff scene
│           ├── CheckUnderstanding.tsx # Interactive concept check quiz with build-time-prerendered KaTeX
│           ├── EvidencePanel.tsx  # Rigorous claim classifications & independent audit breakdown
│           ├── OpenQuestion.tsx   # Open research frontiers in recurrent memory
│           ├── CitationsModal.tsx # Lazy-loaded; iframes public/citations.html
│           ├── ReadmeModal.tsx    # Lazy-loaded; iframes public/readme.html
│           ├── WriteAnnouncer.tsx # One aria-live region announcing every write/clear anywhere on the page
│           ├── ScaleFreeBackground.tsx # Mounting layer for the isometric circuit-city background (background/) — parallax + write-pulse wiring, see §5
│           ├── background/        # IsoCity.tsx (scene composition), city-blocks.tsx (block vocabulary), city-data.ts (seeded randomness)
│           ├── Footer.tsx         # Navigation links, licenses, and external references
│           ├── illustrations/     # IsoIllustration.tsx, IsoScene.tsx, scenes.ts — glassy isometric spot icons
│           └── ui/
│               ├── Panel.tsx, Badge.tsx, SectionHeader.tsx, Button.tsx # Shared card/pill/header/button treatment — see §5
│               ├── Reveal.tsx         # Scroll-triggered fade+rise entrance (+ StaggerGroup/StaggerItem for cascading lists)
│               ├── GlassIcon.tsx      # Squircle-glass wrapper for lucide-react glyphs
│               └── EquationTerm.tsx   # One v/k/M term in a live equation, bidirectionally linked to the Stage diagram
│
├── index.html                     # Legacy reference prototype (static vanilla HTML)
├── js/                            # Legacy prototype scripts (app.js, memory-model.js, bdh-module.js, etc.)
├── css/                           # Legacy prototype stylesheet (style.css)
│
├── data/                          # Precomputed Datasets
│   ├── interference_sweep.json    # Monte Carlo capacity sweep data across d in {4, 8, 16, 32, 64}
│   └── bdh_cq_demo_tasks.json     # ARC-style toy demonstration tasks and state progression
│
├── scripts/                       # Python Reproduction & Build Utilities
│   ├── precompute_interference.py # Generates multi-dim Monte Carlo capacity sweeps
│   ├── precompute_bdh_demo.py     # Generates ARC-style grid tasks and toy state matrices
│   └── generate_readme_html.py    # Generates standalone rendered HTML docs
│
└── docs/                          # Source Documentation & Static Mirrors
    ├── fact_sheet.md              # Immutable source of truth for all claims & metrics
    ├── documentation.md           # In-depth architectural & substrate documentation
    ├── citations.md               # Primary literature bibliography with full annotations
    ├── citations.html             # Standalone KaTeX-rendered citations mirror
    ├── concept_summary.md         # Markdown source for 1-page concept summary
    ├── concept_summary.html       # HTML print layout for PDF generation
    └── readme.html                # Pre-rendered standalone README
```

---

## 3. Mathematical Substrate (`memory-math.ts`)

The core mathematical engine is framework-agnostic, side-effect-free, and contains zero DOM references.

### 3.1 Outer-Product Hebbian Write
To store a key-value association $(\mathbf{k}, \mathbf{v})$ where $\mathbf{k}, \mathbf{v} \in \mathbb{R}^d$ are unit vectors:
$$\mathbf{M}_{t} = \mathbf{M}_{t-1} + \mathbf{v}_t \mathbf{k}_t^T$$
In coordinate form for a $d \times d$ matrix:
$$\mathbf{M}_{i,j} \leftarrow \mathbf{M}_{i,j} + v_i \cdot k_j$$

### 3.2 Linear Readout & Retrieval
To query the memory with probe vector $\mathbf{q} \in \mathbb{R}^d$:
$$\hat{\mathbf{v}} = \mathbf{M} \mathbf{q} = \left( \sum_{p=1}^N \mathbf{v}_p \mathbf{k}_p^T \right) \mathbf{q} = \sum_{p=1}^N \mathbf{v}_p (\mathbf{k}_p^T \mathbf{q})$$

### 3.3 Orthogonal vs. Non-Orthogonal Recall (Cross-talk Interference)
When querying with exact stored key $\mathbf{k}_i$:
$$\hat{\mathbf{v}} = \mathbf{v}_i (\mathbf{k}_i^T \mathbf{k}_i) + \sum_{j \neq i} \mathbf{v}_j (\mathbf{k}_j^T \mathbf{k}_i) = \mathbf{v}_i \|\mathbf{k}_i\|^2 + \underbrace{\sum_{j \neq i} (\mathbf{k}_j^T \mathbf{k}_i) \mathbf{v}_j}_{\text{Cross-talk Interference}}$$

- **Exact Recall:** If all keys are mutually orthonormal ($\mathbf{k}_j^T \mathbf{k}_i = \delta_{ij}$), the interference term vanishes identically, giving $\hat{\mathbf{v}} = \mathbf{v}_i$.
- **Capacity Cliff:** In a $d$-dimensional space, at most $d$ mutually orthogonal vectors exist. When $N > d$, the pigeonhole principle / linear dependence forces non-zero inner products ($\mathbf{k}_j^T \mathbf{k}_i \neq 0$), generating background noise that scales with $\sqrt{N/d}$.

### 3.4 Evaluation Metrics
- **Cosine Similarity:**
  $$\text{sim}(\hat{\mathbf{v}}, \mathbf{v}) = \frac{\hat{\mathbf{v}} \cdot \mathbf{v}}{\|\hat{\mathbf{v}}\| \|\mathbf{v}\|}$$
- **Random Unit Vectors:** Sampled via Box-Muller normal transform and normalized to $\|\mathbf{v}\|_2 = 1$.
- **Deterministic Vectors:** Generated using a seeded 32-bit Mulberry32 PRNG from string hashes.

### 3.5 Additions Beyond the Original Four Functions
`memory-math.ts`'s original exported signatures (`writeAssociation`, `readAssociation`, `cosineSimilarity`, `createRng`, `randomUnitVector`, `vectorDot`, `vectorFromText`, `runInterferenceTrial`) never change — README and in-app footnotes point at them by name. These are purely additive exports powering interactive controls added after the initial build:
- **`makeKeyAtAngle(kRef, θ, rng)`:** Gram-Schmidt construction of a unit key at an exact angle from a reference key, so $k(\theta) \cdot k_{ref} = \cos\theta$ exactly. Powers Memory Lab's Orthogonality Angle (θ) sandbox.
- **`writeWithDecay(M, k, v, η, λ)`:** $M \leftarrow (1-\lambda)M + \eta \cdot v k^T$ — identical to `writeAssociation` at η=1, λ=0. The shared store's `addPair` routes through this exclusively (via the flat mirror's `writeWithDecayInto`), so η/λ are a genuine part of the one write path, not a decorative branch. Powers BDH Module's learning-rate/decay control.
- **`cellContributions(pairs, i, j)`:** per-write breakdown of one matrix cell — one `v_m[i]·k_m[j]` term per stored pair. Powers the Stage's cell inspector.
- **`encodeGrid(grid, dim, seed)` / `decodeGrid(v̂, candidates)`:** seeded random-projection embedding of an ARC-style color grid, and nearest-neighbour cosine decode against known outputs. Powers the playable ARC sandbox (`ArcSandbox.tsx`) — explicitly not a model of real BDH-CQ token-level inference.

### 3.6 The Shared Store (`state/memory-store.ts`)
A plain external store (`createMemoryStore`, `useSyncExternalStore`-based), not React context+reducer, so a write doesn't re-render every consumer regardless of what each actually reads. Three-tier state rule used throughout the Stage codebase — reach for the lowest tier that satisfies the update frequency:
1. **React state** (`useMemorySelector`) for `dim`/`pairs`/`matrix`/`rev` — human-frequency changes, fine to re-render on.
2. **MotionValue** (`useScrollScene`'s `scenePosition`) for scroll/animation progress — never touches the store.
3. **Ref** (`hover`, `focus`, `termHighlight`) for pointer/keyboard interactions the render loop reads directly — mutated outside React, never through `setState`. A separate `requestRender()`/`onRenderRequest()` channel wakes listeners for these without touching `commit()` (which is reserved for actual matrix-state changes — routing a hover through it would, e.g., push spurious duplicate points onto the cliff scene's write history).

### 3.7 The Stage (`stage/`)
`Stage.tsx` is the pinned scrollytelling instrument: one shared canvas+SVG `d×d` matrix that morphs through four scenes (`kv-cache` → `write` → `synapse` → `cliff`, see `state/scene-spec.ts`) as the reader scrolls through four narrative sections. `useScrollScene` maps scroll position to a continuous `scenePosition` MotionValue and a hysteresis-committed discrete `sceneId` (0.06 deadband, so a boundary can't flicker) — `resolveLayout.ts` blends each scene's `layoutFor(p)` for the continuous position, and `stage/render/*` draws it every frame via a park-at-rest `requestAnimationFrame` loop (`hooks/useRafLoop.ts`).

It absorbed the *visualizations* previously duplicated across cards (`ProblemComparison.tsx`, now deleted, into `kv-cache`; Memory Lab's own heatmap into `write`; BDH Module's fabricated grid into `synapse`; Breaking Point's live flood chart into `cliff`) while each component kept its *real* narrative content (controls, ledgers, walkthroughs). On top of the shared matrix: a cell inspector (hover/click/arrow-keys, per-write contribution breakdown), bidirectional equation↔diagram term linking (`components/ui/EquationTerm.tsx`), and a scene-rail nav (`scrollToScene` jumps to the *middle* of a scene's range — its exact start sits inside the hysteresis deadband and never commits).

---

## 4. Pathway Architecture & Literature Context

### 4.1 The Dragon Hatchling (BDH) — arXiv:2509.26507 (Kosowski et al., Sept 2025)
- Biologically-inspired scale-free graph of locally interacting "neuron particles".
- Attention emerges naturally from local synaptic graph updates rather than centralized global matrix multiplication.
- Synaptic plasticity: inference-time activations temporarily modulate synaptic weights, turning network wiring directly into working memory.
- Key properties: ~5% sparse non-negative activations, monosemantic synaptic connections, power-law connectivity.
- **BDH-GPU:** GPU-efficient reformulation leveraging ReLU / low-rank linear attention used for 1B–600B parameter experiments.

### 4.2 BDH-CQ — arXiv:2608.09888 (Engdahl et al., 2026)
- Extends BDH with recurrent latent reasoning for test-time in-context learning.
- Demonstrations (e.g., ARC visual reasoning tasks) are absorbed into recurrent state via Hebbian outer-product writes without gradient descent or token-by-token scratchpads.
- **Reported Benchmark:** 29.5% pass@2 on public ARC-AGI-1 at ~$0.0007/task (150M parameters).

### 4.3 Evidence Discipline & Disclosures (Rubric Requirement)
1. **Live Substrate:** Real-time in-browser linear algebra execution in `memory-math.ts`.
2. **Precomputed Simulation:** Multi-dimensional Monte Carlo capacity curves generated by `precompute_interference.py`.
3. **Synthetic / Didactic:** Original toy ARC-style demonstration grids illustrating test-time state absorption.
4. **Self-Reported Benchmark:** The 29.5% ARC metric is documented as self-reported with a partially-independent audit (conducted by partner institution co-authors, not an arm's-length third party).
5. **Known Failure Modes:** BDH-CQ fails completely (0/72) on composition of color-swap tasks; scaling-law assertions lack published multi-scale ablation studies.

---

## 5. UI Architecture & Component Guide (`react-app/src`)

Everything below `#problem` through `#interference` renders inside the Stage's own narrative column (`stage/Stage.tsx`) — the section markers below name where each piece appears in that scroll flow, not a separate mounted component tree.

| Component | Route / Target | Purpose & Interaction |
| :--- | :--- | :--- |
| `Navbar.tsx` | Sticky Header | Frosted-glass navigation bar with smooth anchor links, documentation triggers, and GitHub links. |
| `Hero.tsx` | `#hero` | Interactive synaptic junction visualization showing real-time outer-product alignment between keys and values; `repeat: Infinity` pulses gated by `usePrefersReducedMotion`. |
| `stage/Stage.tsx` | `#problem`–`#interference` | The pinned scrollytelling instrument — see §3.7. Owns the render loop, the four-scene canvas+SVG matrix, the cell inspector, equation↔diagram linking, and the scene rail. The `#problem` tradeoff table/prose (absorbed from the deleted `ProblemComparison.tsx`) lives directly in this file. |
| `MemoryLab.tsx` | `#memory` | Retrieval Fidelity ledger, Step-by-Step Readout ($\hat{v} = M \cdot q$) walkthrough, Custom Input Sandbox, and the Orthogonality Angle (θ) sandbox (`makeKeyAtAngle`). The heatmap itself is the Stage's `write` scene. |
| `BDHModule.tsx` | `#bdh` | 4-step precomputed ARC walkthrough, the η/λ learning-rate & decay control (`writeWithDecay`), and a "Try It Yourself" toggle into `ArcSandbox.tsx`. The bipartite graph itself is the Stage's `synapse` scene. |
| `ArcSandbox.tsx` | inside `BDHModule.tsx` | Playable ARC-style sandbox: pick a transform rule, write two demonstrations, author a test grid by clicking cells, read the matrix's nearest-neighbour prediction (`encodeGrid`/`decodeGrid`). Always labelled "illustration." |
| `BreakingPoint.tsx` | `#interference` | Precomputed multi-dimensional capacity-cliff curves only ($d \in [4, 64]$) — the live "Flood" stress-test instrument is the Stage's `cliff` scene, built from the same shared store. |
| `CheckUnderstanding.tsx` | Mid-page self-check | Free-text diagnostic with keyword feedback and a formal derivation using build-time-prerendered KaTeX (`lib/prerendered-katex.ts`) — no runtime `katex` import. |
| `EvidencePanel.tsx` | `#evidence` | Rubric-compliant audit panel classifying claims into Live, Precomputed, Synthetic, and Self-Reported categories. |
| `OpenQuestion.tsx` | `#research` | Curated exploration of open research frontiers in recurrent memory (decay rules, non-linear retrieval, dynamic capacity). |
| `CitationsModal.tsx` | `#citations` | Lazy-loaded (`React.lazy`); iframes the prerendered `public/citations.html` rather than re-parsing markdown at runtime. |
| `ReadmeModal.tsx` | `#readme` | Lazy-loaded (`React.lazy`); iframes the prerendered `public/readme.html`. |
| `WriteAnnouncer.tsx` | — (a11y) | One always-mounted `aria-live` region announcing every write/clear anywhere on the page, debounced so a 20-pair Flood coalesces into one announcement. |
| `ScaleFreeBackground.tsx` | Background | Mounts the isometric circuit-city (`components/background/`: `IsoCity.tsx` composition, `city-blocks.tsx` block vocabulary built on `lib/iso.ts`, `city-data.ts` seeded randomness). Three-band scroll parallax, a CSS mask so it stays rich in the page margins and calm behind the reading column, and a write-pulse that travels along a board trace into the CPU block on every real memory write. Static (no parallax/pulses) under `prefers-reduced-motion`. |
| `Footer.tsx` | Page Bottom | Unambiguous links to GitHub, Live Site, PDF Summary, Citations, and License. |
| `components/illustrations/` | Section eyebrows | `IsoIllustration.tsx`/`IsoScene.tsx`/`scenes.ts` — glassy isometric spot icons (kv-cache, memory-bank, synapse-lattice, overflow, data-vault). |
| `components/ui/Panel.tsx` | Every card site-wide | The one card treatment (translucent glass, inset top highlight, layered shadow, optional `tone` accent) — replaces the `bg-surface/90 border ... shadow-md backdrop-blur-sm` string previously hand-copied into every card. |
| `components/ui/Badge.tsx` | Evidence/provenance pills | Tone-mapped pill (`deployed`/`precomputed`/`self-reported`/`audited`/`illustration`/`neutral`) — previously every such pill rendered the same flat grey regardless of what it claimed. |
| `components/ui/SectionHeader.tsx` | Major section headers | Numbered mono eyebrow + scroll-triggered hairline rule + Fraunces title (+ optional icon/lede) — the pattern each section used to hand-roll slightly differently. |
| `components/ui/Button.tsx` | CTAs | One spring hover/tap + one radius across `variant: primary\|tonal\|ghost\|danger`; `as="a"` renders an anchor with the same treatment. |
| `components/ui/GlassIcon.tsx` | Badges/controls | Squircle-glass wrapper for `lucide-react` glyphs. |
| `components/ui/EquationTerm.tsx` | Inline in equations | One v/k/M term, bidirectionally linked to the Stage's matrix diagram via `store.termHighlight` — see §3.7. |

---

## 6. Development & Build Workflows

### 6.1 Running the Authoritative React App
```bash
cd react-app

# Install dependencies (React 19, lucide-react, motion, TailwindCSS; katex is a devDependency, used only to regenerate lib/prerendered-katex.ts)
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

### 6.2 Running Python Precomputation & Utilities
```bash
# Generate multi-dimensional Monte Carlo capacity sweeps -> data/interference_sweep.json
python3 scripts/precompute_interference.py

# Generate ARC demonstration tasks -> data/bdh_cq_demo_tasks.json
python3 scripts/precompute_bdh_demo.py

# Generate standalone HTML mirrors
python3 scripts/generate_readme_html.py
```

### 6.3 Running Legacy Static Prototype
```bash
# From workspace root
python3 -m http.server 8080
# Visit http://localhost:8080/
```

---

## 7. Style Guide & Design Tokens

- **Palette Theme:** a warm editorial "paper" palette by default (`#FAF9F6` canvas); the Stage and every live chart rescope the *same* CSS custom properties to a dark "instrument" palette via `.instrument-panel`/`.retro-terminal-frame` (`#0B0C0E` canvas) — one token set, two themes, defined once in `index.css`. Token names are unchanged across both.
- **Core Semantic Colors** (`text-*`/`bg-*`, light value → dark-instrument value):
  - **Memory / State / $O(1)$:** `text-memory` — `#1D62C1` → `#00D2FF`
  - **Interference / Overload / $O(n)$:** `text-interference` — `#B43927` → `#FF4D4D`
  - **Ground Truth / High Recall:** `text-truth` — `#0C7350` → `#00E5A3`
  - **BDH / Synaptic:** `text-synapse` — `#6F3EC9` → `#A78BFA` (whole-matrix highlight, ARC sandbox rule chips)
  - **Precomputed / Provenance:** `text-data` — `#975314` → `#F59E0B`
  - (Light values above are darkened from the original design-pass hues — `index.css`'s `:root` block documents the contrast sweep that produced them; the dark-instrument values are unaffected.)
- **Typography:**
  - *Headings (unclassed `h1`–`h6`):* **Fraunces**, forced by `index.css`'s base layer regardless of Tailwind classes present.
  - *`font-display` / `font-mono` utilities:* **Departure Mono** (`tailwind.config.js` maps both to the same stack) — applying either to a heading overrides the base-layer Fraunces rule, since utilities compile after base styles.
  - *`font-serif` utility:* **not** Fraunces — `tailwind.config.js` defines no custom `serif` key, so this resolves to Tailwind's default serif stack (Georgia/Times). Reach for an unclassed heading tag (or `font-display` where mono is actually wanted) rather than `font-serif` to get Fraunces.
  - *Body Copy:* **Inter** (`font-sans`)

---

## 8. Guidelines for AI Assistants & Pair Programmers

1. **Preserve Mathematical Fidelity:** Any modifications to associative memory logic must adhere to the pure mathematical definitions in `react-app/src/lib/memory-math.ts`.
2. **Adhere to `fact_sheet.md`:** Do not fabricate benchmark scores or mischaracterize claims. BDH-CQ's 29.5% ARC score must always be attributed to Kosowski et al. / Engdahl et al. with disclosed auditing status.
3. **Respect Evidence Classification:** Keep live browser calculations clearly separated from precomputed Monte Carlo sweeps and synthetic didactic visuals.
4. **Prioritize the React App:** The authoritative deliverable is `react-app/`. Any feature additions or enhancements must be made in the React codebase.
