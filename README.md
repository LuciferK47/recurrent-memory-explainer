# Recurrent Memory Explainer: How Fixed-Size State Learns and Forgets

> **DataForge 2026 &times; Pathway Track Submission**  
> *Track: Explain the Frontier &mdash; In-Context Learning with Recurrent Memory*

[![Team Repository](https://img.shields.io/badge/GitHub-LuciferK47%2Frecurrent--memory--explainer-blue?logo=github)](https://github.com/LuciferK47/recurrent-memory-explainer)
[![Live Explainer](https://img.shields.io/badge/Artifact-Live_Web_App-green)](https://luciferk47.github.io/recurrent-memory-explainer/)
[![Concept Summary PDF](https://img.shields.io/badge/PDF-Concept_Summary-red)](concept_summary.pdf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. The Central Locked Claim

> *"A fixed-size recurrent memory can absorb key–value associations from demonstrations and recall them accurately — until the number of associations exceeds the memory's rank, at which point recall degrades through interference in a predictable, measurable way."*

Standard Transformers rely on an unbounded Key–Value (KV) cache scaling linearly ($O(n)$ footprint per sequence). In contrast, fixed-size recurrent models (such as Pathway's **Dragon Hatchling / BDH** and **BDH-CQ**) compress associations into a constant-size $d \times d$ matrix, achieving $O(1)$ memory complexity per sequence during inference. This interactive explainer demonstrates the Hebbian outer-product mechanism that enables this test-time learning, and pinpoints exactly where and why retrieval collapses due to cross-talk interference.

---

## 2. Pedagogical Framework

- **Target Audience:** CS/ML students, researchers, and junior practitioners who understand self-attention but have not built or analyzed recurrent associative memory systems.
- **Prerequisites:** Basic linear algebra (vectors, inner/outer products, matrix rank, orthogonality) and high-level knowledge of Transformers.
- **Core Learning Objectives:**
  1. **Explain the algebraic write rule:** Understand how rank-1 Hebbian outer products ($M \leftarrow M + v k^T$) superimpose key–value pairs into a bounded state matrix.
  2. **Predict the capacity cliff:** Calculate when associative recall degrades given matrix dimension $d$ and number of stored items $N$ (governed by the orthogonality condition).
  3. **Demystify BDH & BDH-CQ:** Describe how Pathway's architecture absorbs in-context demonstrations directly into synaptic memory without gradient updates or token-level chain-of-thought scratchpads.

---

## 3. Architecture of the Artifact

> **Authoritative Submission Artifact**: The primary deliverable for this submission is the production **React 19 + TypeScript + Vite + Tailwind** application located in `react-app/`.  
> *Note on Vanilla Prototype*: A standalone vanilla HTML/JS/CSS implementation in the root directory is retained strictly as a legacy reference prototype for low-dependency inspection, but the React build is the definitive submission deliverable.

```
recurrent-memory-explainer/
├── react-app/                     # AUTHORITATIVE SUBMISSION ARTIFACT (React 19 + Vite)
│   ├── src/
│   │   ├── App.tsx                 # App shell: MotionConfig + shared-store provider, lazy modals
│   │   ├── index.css               # Design tokens, typography, base layer
│   │   ├── lib/
│   │   │   ├── memory-math.ts        # Pure mathematical substrate (zero DOM dependencies)
│   │   │   ├── memory-math-flat.ts   # Float32Array hot-path mirror for the Stage's render loop
│   │   │   ├── canvas.ts             # Stage-unit coordinate system (STAGE_W/STAGE_H)
│   │   │   ├── layout.ts             # StageLayout type + MATRIX_TARGET/GRAPH_TARGET/PLOT_TARGET
│   │   │   ├── colormap.ts           # Diverging heatmap colormap
│   │   │   └── iso.ts                # Isometric-projection primitives (project/isoBlock/shade)
│   │   ├── state/                    # memory-store.ts (external store), scene-spec.ts (Stage scenes)
│   │   ├── hooks/                    # useScrollScene, useRafLoop, useStageSurface, usePrefersReducedMotion
│   │   ├── stage/                    # The pinned scrollytelling instrument
│   │   │   ├── Stage.tsx               # Render loop, cell inspector, magnifying loupe, scene stepper
│   │   │   ├── StageOverlay.tsx        # SVG legends, axis ticks, colorbar
│   │   │   ├── scenes/                 # kv-cache / write / synapse / cliff layoutFor(p)
│   │   │   └── render/                 # draw-matrix, draw-graph, draw-plot, draw-loupe, ...
│   │   └── components/
│   │       ├── Navbar.tsx              # Floating nav pill + scroll-progress bar
│   │       ├── Hero.tsx                # Signature Hebbian synaptic junction visualization
│   │       ├── ScaleFreeBackground.tsx # Isometric circuit-city background (+ background/ subdir)
│   │       ├── MemoryLab.tsx           # Live associative matrix ledger, sandboxes, θ-angle control
│   │       ├── BDHModule.tsx           # BDH walkthrough + ArcSandbox.tsx (playable ARC sandbox)
│   │       ├── BreakingPoint.tsx       # Precomputed multi-dimensional capacity sweep chart
│   │       ├── CheckUnderstanding.tsx  # Interactive self-check with a tri-state right/wrong verdict
│   │       ├── EvidencePanel.tsx       # Claims audit & architecture comparison table
│   │       ├── OpenQuestion.tsx        # Open research frontiers
│   │       ├── CitationsModal.tsx / ReadmeModal.tsx  # Lazy-loaded document viewers
│   │       ├── WriteAnnouncer.tsx      # One aria-live region for every write/clear on the page
│   │       ├── illustrations/          # Isometric spot-icon suite (section anchors)
│   │       └── ui/                     # Panel, Badge, Button, SectionHeader, Reveal, GlassIcon, EquationTerm
├── index.html, js/, css/          # Legacy reference prototype (static vanilla HTML) — not the submission artifact
├── data/                          # interference_sweep.json, bdh_cq_demo_tasks.json — both self-labeled with provenance
├── scripts/                       # precompute_interference.py, precompute_bdh_demo.py, generate_readme_html.py
├── docs/
│   ├── citations.md               # Primary literature catalog (Group A & Group B)
│   ├── citations.html             # Pre-rendered standalone citations viewer with KaTeX
│   ├── concept_summary.md         # Concept summary source (~850 words)
│   ├── concept_summary.html       # Print stylesheet for PDF rendering
│   ├── readme.html                # Pre-rendered standalone README viewer
│   └── fact_sheet.md              # Immutable factual source of truth
├── ATTRIBUTIONS.md                # Full third-party code/font/data/license record
├── requirements.txt               # Python deps (numpy) for scripts/
└── concept_summary.pdf            # Compiled concept summary PDF
```

### Component Evidence Ledger (Live vs. Precomputed vs. Synthetic)

| Module / Component | Mechanism | Category | Technical Description |
| :--- | :--- | :--- | :--- |
| **Stage — write scene (02)** | Matrix Heatmap & Cosine Readout | **Live Substrate** | 100% computed live in-browser via pure math module (`memory-math.ts`). Exact outer products and dot products; hover/arrow-key any cell for a per-write contribution breakdown via the magnifying loupe. |
| **Stage — cliff scene (04)** | Live Flood + Precomputed Reference Band | **Live Substrate + Precomputed** | The solid trace is a real-time simulation plotting degradation as writes land in the live shared store; the dashed band beneath it is the precomputed sweep below, kept visually distinct per the evidence-discipline rule in `docs/fact_sheet.md`. |
| **Interference Sweep (04)** | Multi-D Capacity Curves | **Precomputed** | Monte Carlo sweeps across $d \in \{4, 8, 16, 32, 64\}$ generated by `scripts/precompute_interference.py` (20 trials/pt). |
| **BDH-CQ Walkthrough (03)** | ARC Grid Demonstrations | **Synthetic / Didactic** | Original visual grid tasks (not ARC-AGI data — see `ATTRIBUTIONS.md`) illustrating demonstration absorption without gradient updates; always labelled "illustration" in-app. |
| **Hero Diagram** | Synaptic Junction Animation | **Animated Model** | Live reactive vector field demonstrating outer-product alignment between keys and values. |
| **29.5% ARC-AGI-1 Metric** | Benchmark Badge | **Self-Reported** | Reported by Engdahl et al. (arXiv:2608.09888); self-reported benchmark with a partially-independent audit. |

---

## 4. Local Setup & Reproduction Instructions

### Running the React Application (Recommended / Authoritative)

```bash
# Navigate to the react-app directory
cd react-app

# Install dependencies (node_modules/ is not checked in)
npm install

# Start the Vite development server
npm run dev
# -> Opens on http://localhost:5173/

# Build for production
npm run build
# -> Compiles static bundle to react-app/dist/
```

### Running the Legacy Prototype (Static Vanilla HTML/JS)

```bash
# From the root repository directory
python3 -m http.server 8080
# -> Visit http://localhost:8080/ in any standard browser
```

### Precomputing Sweeps (Optional Python Reproduction)

```bash
# From the repository root — install the one Python dependency (NumPy)
pip install -r requirements.txt

# Generate the multi-dimensional capacity degradation data -> data/interference_sweep.json
python3 scripts/precompute_interference.py

# Generate the toy ARC-style demonstration states -> data/bdh_cq_demo_tasks.json
python3 scripts/precompute_bdh_demo.py
```

Both scripts write to `data/`; the copies under `react-app/public/data/` that the
live app actually fetches are mirrored by hand and won't update automatically —
re-copy them after regenerating.

`scripts/generate_readme_html.py` (stdlib-only, no install needed) regenerates
`docs/readme.html` and `react-app/public/readme.html` from this file:

```bash
python3 scripts/generate_readme_html.py
```

---

<a name="citations"></a>
## 5. Citations & References

Full annotations and paper summaries are available in [docs/citations.md](docs/citations.md) and online at [docs/citations.html](https://luciferk47.github.io/recurrent-memory-explainer/docs/citations.html).

### Group A: General Recurrent Memory & In-Context Learning (2022–2026)
- **Infini-attention:** Munkhdalai, Faruqui, & Gopal, *Leave No Context Behind: Efficient Infinite Context Transformers with Infini-attention*, [arXiv:2404.07143](https://arxiv.org/abs/2404.07143), 2024.
- **Titans:** Behrouz, Zhong, & Mirrokni, *Titans: Learning to Memorize at Test Time*, [arXiv:2501.00663](https://arxiv.org/abs/2501.00663), 2025.
- **Gated DeltaNet:** Yang, Kautz, & Hatamizadeh, *Gated Delta Networks: Improving Mamba2 with Delta Rule*, [arXiv:2412.06464](https://arxiv.org/abs/2412.06464), 2024 (ICLR 2025).
- **Variational Linear Attention:** Pandey & Singh, *Variational Linear Attention: Stable Associative Memory for Long-Context Transformers*, [arXiv:2605.11196](https://arxiv.org/abs/2605.11196), 2026.

### Group B: BDH & BDH-CQ Primary Sources
- **The Dragon Hatchling (BDH):** Kosowski et al., *The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain*, [arXiv:2509.26507](https://arxiv.org/abs/2509.26507), Sept 2025.
- **BDH-CQ:** Engdahl et al., *BDH-CQ: In-Context Learning with Recurrent Latent Reasoning*, [arXiv:2608.09888](https://arxiv.org/abs/2608.09888), 2026. Discussion on [Hugging Face Papers](https://huggingface.co/papers/2608.09888).
- **Pathway BDH Reference Implementation:** [https://github.com/pathwaycom/bdh](https://github.com/pathwaycom/bdh) *(Official Pathway toy implementation, not this project's code)*.
- **Pathway Research Articles:** [BDH Explainer](https://pathway.com/research/bdh-explainer) &middot; [Introducing BDH-CQ](https://pathway.com/research/introducing-bdh-cq).

---

## 6. Disclosures, AI Assistance, & License Records

### AI Disclosure
- **Code Assistance:** Claude 3.5 Sonnet and Google Gemini via Antigravity IDE for scaffolding, interactive UI components, and test-suite composition.
- **Simulations:** Monte Carlo sweep scripts written and reviewed by the team.
- **Prose & Copy:** Drafted with assistance, strictly constrained to `docs/fact_sheet.md` source of truth.

### Licenses & Asset Attributions
- **Source Code:** [MIT License](LICENSE) &copy; 2026 Team DataForge &times; Pathway Track.
- **Typography:**
  - *Departure Mono* (self-hosted, `react-app/public/fonts/`): SIL Open Font License 1.1 (Helena Zhang) — full license text shipped as `OFL.txt` alongside the font file.
  - *Inter*: SIL Open Font License 1.1 (Rasmus Andersson)
  - *Fraunces*: SIL Open Font License 1.1 (Undercase Type)
  - *JetBrains Mono*: SIL Open Font License 1.1 (JetBrains)
- **Math Engine:** KaTeX: MIT License (Khan Academy).
- **Full record:** code dependencies (React, motion, lucide-react, Tailwind, NumPy, ...), data-file provenance, and original-graphics attribution are all in **[`ATTRIBUTIONS.md`](ATTRIBUTIONS.md)**.
