# Recurrent Memory Explainer: How Fixed-Size State Learns and Forgets

> **DataForge 2026 &times; Pathway Track Submission**  
> *Track: Explain the Frontier &mdash; In-Context Learning with Recurrent Memory*

[![Team Repository](https://img.shields.io/badge/GitHub-LuciferK47%2Frecurrent--memory--explainer-blue?logo=github)](https://github.com/LuciferK47/recurrent-memory-explainer)
[![Live Explainer](https://img.shields.io/badge/Artifact-Live_Web_App-green)](https://luciferk47.github.io/recurrent-memory-explainer/)
[![Concept Summary PDF](https://img.shields.io/badge/PDF-One--Page_Concept_Summary-red)](concept_summary.pdf)
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
Pathway_IITKGP/
├── react-app/                     # AUTHORITATIVE SUBMISSION ARTIFACT (React 19 + Vite)
│   ├── src/
│   │   ├── lib/memory-math.ts     # Pure mathematical substrate (zero DOM dependencies)
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Frosted glass floating navigation pill
│   │   │   ├── Hero.tsx           # Signature Hebbian synaptic junction visualization
│   │   │   ├── ProblemComparison.tsx  # Interactive O(n) KV-Cache vs O(1) State comparison
│   │   │   ├── MemoryLab.tsx      # Live associative matrix heatmap & cosine similarity instrument
│   │   │   ├── BDHModule.tsx      # Step-by-step visual ARC-style grid demonstration walkthrough
│   │   │   ├── BreakingPoint.tsx  # Live stress testing & precomputed multi-dim capacity sweep
│   │   │   ├── EvidencePanel.tsx  # Rigorous claims, independent audits, & comparison matrix
│   │   │   ├── OpenQuestion.tsx   # Open research frontiers in recurrent memory
│   │   │   ├── CitationsModal.tsx # In-app rendered markdown & KaTeX citations viewer
│   │   │   └── Footer.tsx         # Five unambiguous destination links & citations
│   │   └── index.css              # Custom Departure Mono, Fraunces, and Inter typography tokens
├── index.html                     # Legacy reference prototype (static vanilla HTML)
├── js/app.js                      # Legacy prototype script
├── css/style.css                  # Legacy prototype stylesheet
├── docs/
│   ├── citations.md               # Primary literature catalog (Group A & Group B)
│   ├── citations.html             # Pre-rendered standalone citations viewer with KaTeX
│   ├── concept_summary.md         # 1-page technical concept summary
│   ├── concept_summary.html       # Print stylesheet for PDF rendering
│   └── fact_sheet.md              # Immutable factual source of truth
└── concept_summary.pdf            # Compiled 1-page PDF briefing
```

### Component Evidence Ledger (Live vs. Precomputed vs. Synthetic)

| Module / Component | Mechanism | Category | Technical Description |
| :--- | :--- | :--- | :--- |
| **Memory Lab (02)** | Matrix Heatmap & Cosine Readout | **Live Substrate** | 100% computed live in-browser via pure math module (`memory-math.ts`). Exact outer products and dot products. |
| **Breaking Point (04) Live Flood** | Stress Test Chart | **Live Substrate** | Real-time simulation plotting degradation curve as random vectors flood the live state. |
| **Interference Sweep (04)** | Multi-D Capacity Curves | **Precomputed** | Monte Carlo sweeps across $d \in \{4, 8, 16, 32, 64\}$ generated by `scripts/precompute_interference.py` (20 trials/pt). |
| **BDH-CQ Walkthrough (03)** | ARC Grid Demonstrations | **Synthetic / Didactic** | Handcrafted, original visual grid tasks illustrating demonstration absorption without gradient updates. |
| **Hero Diagram** | Synaptic Junction Animation | **Animated Model** | Live reactive vector field demonstrating outer-product alignment between keys and values. |
| **29.5% ARC-AGI-1 Metric** | Benchmark Badge | **Self-Reported** | Reported by Kosowski et al. (arXiv:2608.09888); self-reported benchmark with a partially-independent audit. |

---

## 4. Local Setup & Reproduction Instructions

### Running the React Application (Recommended / Authoritative)

```bash
# Navigate to the react-app directory
cd react-app

# Dependencies are already installed; to reinstall or update:
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
# Generate the multi-dimensional capacity degradation data
python3 scripts/precompute_interference.py

# Generate the toy ARC-style demonstration states
python3 scripts/precompute_bdh_demo.py
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
  - *Departure Mono*: SIL Open Font License 1.1 (Helena Zhang)
  - *Inter*: SIL Open Font License 1.1 (Rasmus Andersson)
  - *Fraunces*: SIL Open Font License 1.1 (Undercase Type)
- **Math Engine:** KaTeX: MIT License (Khan Academy).
