# Project Documentation: Recurrent Memory Explainer

This document outlines the architecture, user interface (UI), and core logic ("backend") for the DataForge 2026 Pathway Track hackathon submission. 

Our goal was to build a highly interactive, beautifully designed explainer that demonstrates how a fixed-size recurrent memory (like the one used in BDH and BDH-CQ) learns from demonstrations and eventually forgets due to interference.

---

## 1. Architecture Overview

To meet the strict "no sign-in", "fast feedback", and "cold start" constraints of the hackathon, the project is architected as a **static web application**. 

* **Frontend:** Vanilla HTML, CSS, and JS (No heavy frameworks, ensuring instant load times).
* **"Backend" / Substrate:** Core math and logic execute live in the browser via JavaScript (`memory-model.js`).
* **Precomputation:** Python scripts are used ahead of time to run heavy Monte Carlo simulations (interference sweeps) and generate task data, which are loaded as static JSON files.

---

## 2. Core Logic & "Backend"

Because this is a static site, the "backend" consists of two parts: the offline Python data pipelines and the live JavaScript mathematical model.

### A. The Real Substrate (`js/memory-model.js`)
This is the heart of the interactive explainer. It implements the exact mathematical mechanism used by BDH for synaptic memory (arXiv:2509.26507) and BDH-CQ for in-context learning (arXiv:2608.09888).
* **Hebbian Write:** `M ← M + v · kᵀ` (Outer-product accumulation)
* **Linear Readout:** `v̂ = M · q`
* **Execution:** Every time the user interacts with the "Memory Lab" or the "Breaking Point" sections, this code runs live, updating a `d×d` state matrix and calculating cosine similarity between recalled vectors and true vectors.

### B. Python Precomputation Scripts (`scripts/`)
Heavy computational tasks are precomputed to ensure the UI remains 60fps.
* **`precompute_interference.py`**: Runs thousands of trials simulating memory overload (from 1 to `4d` associations across dimensions 4 to 64). Outputs statistical means, standard deviations, and capacity cliff points to `data/interference_sweep.json`.
* **`precompute_bdh_demo.py`**: Generates original, ARC-style toy grid tasks (Input → Output demonstrations) to be used in the BDH-CQ walkthrough section. Outputs to `data/bdh_cq_demo_tasks.json`.

---

## 3. User Interface (UI) & Visualizations

The UI is designed to feel premium, educational, and highly interactive. It uses a custom design system built with vanilla CSS.

### A. Design System (`css/style.css`)
* **Aesthetics:** Dark mode with "glassmorphism" components (frosted glass cards using `backdrop-filter: blur`), glowing accent colors, and a radial gradient hero section.
* **Color Coding:** We use a strict semantic color palette:
  * **Blue (`#60a5fa`)**: Represents Memory, State, and O(1) constants.
  * **Amber/Red (`#f59e0b`, `#ef4444`)**: Represents Interference, degradation, and O(n) growth.
  * **Green (`#4ade80`)**: Represents Ground Truth and high similarity/accuracy.
* **Typography:** Inter (for body) and JetBrains Mono (for numbers, code, and matrices) loaded via Google Fonts.

### B. Interactive Modules (`js/app.js` & `js/visualizations.js`)
We use HTML5 Canvas for high-performance rendering of matrices and charts.

1. **Section 1: The Problem (KV-Cache vs Fixed State)**
   * Animated canvas charts contrasting the O(n) memory growth of standard Transformers against the O(1) memory usage of recurrent state.
2. **Section 2: Memory Lab**
   * **Live Heatmap:** Renders the `d×d` memory matrix as it updates in real-time using a diverging blue-white-red color scale.
   * **Truth Table:** Dynamically displays the cosine similarity of stored pairs vs. recalled pairs, updating live as the memory degrades.
3. **Section 3: BDH-CQ Walkthrough (`js/bdh-module.js`)**
   * A step-by-step interactive scrollable module illustrating how ARC-style demonstrations are absorbed into the memory state without gradient updates.
   * Renders color-coded grids using custom DOM elements.
4. **Section 4: The Breaking Point**
   * **Live Overload Chart:** As users rapidly click "Flood (+20)", a live canvas chart plots the degradation of mean recall accuracy.
   * **Precomputed Sweep Chart:** Renders the multi-dimensional capacity cliffs from the Python-generated JSON data.

### C. Scroll Controller (`js/scroll-controller.js`)
* Uses `IntersectionObserver` to trigger fade-in animations as elements enter the viewport.
* Drives the right-side dot navigation, allowing users to jump between sections smoothly.

---

## 4. Evidence Labelling Strategy

Following the strict hackathon rubric, every piece of data and visualization in the UI is clearly labeled to distinguish between:
* **Real Substrate:** Live math running in the browser (Memory Lab).
* **Precomputed:** Python simulations loaded via JSON (Interference Sweep).
* **Illustration:** Conceptual walkthroughs (BDH-CQ ARC grids).
* **Self-Reported Benchmark:** Claims taken from the official papers (e.g., the 29.5% pass@2 claim).

This transparent labeling protects the submission from rubric penalties regarding "Evidence Discipline".
