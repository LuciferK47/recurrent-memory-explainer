/**
 * app.js — Main Application Orchestrator
 *
 * Wires together: memory model, visualizations, BDH module, scroll controller.
 * Initializes all interactive components and handles user events.
 */

import { AssociativeMemory, randomUnitVector } from './memory-model.js';
import {
    renderHeatmap,
    updateTruthTable,
    updateCapacityDisplay,
    renderKVGrowth,
    renderFixedState,
    renderSweepChart,
    renderOverloadChart,
} from './visualizations.js';
import { BDHModule } from './bdh-module.js';
import { ScrollController } from './scroll-controller.js';

// ===== State =====
let memory = null;         // Main memory model (Section 2)
let overloadMemory = null;  // Overload experiment (Section 4)
let overloadHistory = [];   // History for overload chart
let sweepData = null;       // Precomputed interference data
let pairCounter = 0;        // For naming pairs

// Semantic labels for random pairs
const PAIR_LABELS = [
    'cat → furry', 'sky → blue', 'sun → warm', 'rain → wet',
    'code → logic', 'math → proof', 'music → rhythm', 'tree → green',
    'fire → hot', 'ice → cold', 'book → words', 'star → bright',
    'wave → ocean', 'key → lock', 'bird → flight', 'wind → breeze',
    'moon → night', 'seed → grow', 'cloud → float', 'river → flow',
    'stone → solid', 'light → fast', 'dream → sleep', 'bell → ring',
    'leaf → fall', 'snow → white', 'gold → shine', 'salt → taste',
    'map → path', 'echo → sound', 'dust → settle', 'spark → ignite',
];

// ===== Initialization =====
async function init() {
    console.log('[app] Initializing explainer...');

    // 1. Scroll controller
    const scrollCtrl = new ScrollController();
    scrollCtrl.init();

    // 2. Section 1 — KV-cache animations
    initSection1();

    // 3. Section 2 — Memory Lab
    initMemoryLab();

    // 4. Section 3 — BDH Module
    await initBDHModule();

    // 5. Section 4 — Interference / Overload
    await initInterferenceSection();

    // 6. Render KaTeX equations
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(document.body, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
            ],
        });
    }

    // 7. Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            refreshAllVisuals();
        }, 200);
    });

    // 8. Load preset (4 pairs in d=8 memory) so hero isn't blank
    loadPreset();

    console.log('[app] Ready.');
}

// ===== Section 1: KV-Cache Comparison =====
function initSection1() {
    const kvCanvas = document.getElementById('kv-growth-canvas');
    const fixedCanvas = document.getElementById('fixed-state-canvas');

    if (kvCanvas) renderKVGrowth(kvCanvas, 1);
    if (fixedCanvas) renderFixedState(fixedCanvas, 1);
}

// ===== Section 2: Memory Lab =====
function initMemoryLab() {
    const dimSelect = document.getElementById('dim-select');
    const addBtn = document.getElementById('add-pair-btn');
    const add5Btn = document.getElementById('add-5-btn');
    const clearBtn = document.getElementById('clear-btn');

    const dim = parseInt(dimSelect?.value || '8');
    memory = new AssociativeMemory(dim);
    pairCounter = 0;

    // Dimension change
    dimSelect?.addEventListener('change', () => {
        const newDim = parseInt(dimSelect.value);
        memory = new AssociativeMemory(newDim);
        pairCounter = 0;
        document.getElementById('dim-value').textContent = newDim;
        refreshMemoryVisuals();
    });

    // Add pair
    addBtn?.addEventListener('click', () => addRandomPair());
    add5Btn?.addEventListener('click', () => {
        for (let i = 0; i < 5; i++) addRandomPair();
    });

    // Clear
    clearBtn?.addEventListener('click', () => {
        memory.clear();
        pairCounter = 0;
        refreshMemoryVisuals();
    });

    refreshMemoryVisuals();
}

function addRandomPair() {
    if (!memory) return;
    const key = randomUnitVector(memory.dim);
    const value = randomUnitVector(memory.dim);
    const label = PAIR_LABELS[pairCounter % PAIR_LABELS.length];
    pairCounter++;
    memory.write(key, value, label);
    refreshMemoryVisuals();
}

function refreshMemoryVisuals() {
    if (!memory) return;

    // Heatmap
    const canvas = document.getElementById('heatmap-canvas');
    if (canvas) renderHeatmap(canvas, memory.getMatrix());

    // Truth table
    const tbody = document.getElementById('truth-table-body');
    if (tbody) updateTruthTable(tbody, memory.recallAll());

    // Capacity
    updateCapacityDisplay(memory.capacityRatio);

    // Stored count
    const countEl = document.getElementById('stored-count');
    if (countEl) countEl.textContent = memory.count;

    // Mean recall
    const meanEl = document.getElementById('mean-recall');
    if (meanEl) {
        const mean = memory.getMeanRecall();
        meanEl.textContent = (mean * 100).toFixed(1) + '%';
        if (mean >= 0.9) meanEl.className = 'font-mono text-green';
        else if (mean >= 0.7) meanEl.className = 'font-mono text-amber';
        else meanEl.className = 'font-mono text-red';
    }
}

function loadPreset() {
    // Pre-load 4 pairs so the page opens with something visible
    for (let i = 0; i < 4; i++) {
        addRandomPair();
    }
}

// ===== Section 3: BDH Module =====
async function initBDHModule() {
    try {
        const resp = await fetch('data/bdh_cq_demo_tasks.json');
        const data = await resp.json();
        const bdhModule = new BDHModule();
        await bdhModule.init(data);
    } catch (e) {
        console.warn('[app] Could not load BDH demo data:', e.message);
    }
}

// ===== Section 4: Interference =====
async function initInterferenceSection() {
    // Overload experiment
    const dimSelect = document.getElementById('overload-dim-select');
    const addBtn = document.getElementById('overload-add-btn');
    const floodBtn = document.getElementById('overload-flood-btn');
    const clearBtn = document.getElementById('overload-clear-btn');

    const dim = parseInt(dimSelect?.value || '8');
    overloadMemory = new AssociativeMemory(dim);
    overloadHistory = [];

    dimSelect?.addEventListener('change', () => {
        const newDim = parseInt(dimSelect.value);
        overloadMemory = new AssociativeMemory(newDim);
        overloadHistory = [];
        refreshOverloadVisuals();
    });

    addBtn?.addEventListener('click', () => addOverloadPair());
    floodBtn?.addEventListener('click', () => {
        for (let i = 0; i < 20; i++) addOverloadPair();
    });
    clearBtn?.addEventListener('click', () => {
        const dim = overloadMemory.dim;
        overloadMemory = new AssociativeMemory(dim);
        overloadHistory = [];
        refreshOverloadVisuals();
    });

    refreshOverloadVisuals();

    // Precomputed sweep chart
    try {
        const resp = await fetch('data/interference_sweep.json');
        sweepData = await resp.json();
        const sweepCanvas = document.getElementById('sweep-chart-canvas');
        if (sweepCanvas && sweepData?.sweep) {
            renderSweepChart(sweepCanvas, sweepData.sweep);
        }
    } catch (e) {
        console.warn('[app] Could not load sweep data:', e.message);
    }
}

function addOverloadPair() {
    if (!overloadMemory) return;
    const key = randomUnitVector(overloadMemory.dim);
    const value = randomUnitVector(overloadMemory.dim);
    overloadMemory.write(key, value, `P${overloadMemory.count}`);

    const recall = overloadMemory.getMeanRecall();
    overloadHistory.push({ n: overloadMemory.count, recall });
    refreshOverloadVisuals();
}

function refreshOverloadVisuals() {
    if (!overloadMemory) return;

    const countEl = document.getElementById('overload-count');
    if (countEl) countEl.textContent = overloadMemory.count;

    const recallEl = document.getElementById('overload-recall');
    if (recallEl) {
        const recall = overloadMemory.count > 0 ? overloadMemory.getMeanRecall() : null;
        if (recall !== null) {
            recallEl.textContent = (recall * 100).toFixed(1) + '%';
            if (recall >= 0.9) recallEl.className = 'control-value text-green';
            else if (recall >= 0.7) recallEl.className = 'control-value text-amber';
            else recallEl.className = 'control-value text-red';
        } else {
            recallEl.textContent = '—';
            recallEl.className = 'control-value text-green';
        }
    }

    const chart = document.getElementById('overload-chart-canvas');
    if (chart) renderOverloadChart(chart, overloadHistory, overloadMemory.dim);
}

// ===== Refresh All =====
function refreshAllVisuals() {
    refreshMemoryVisuals();
    refreshOverloadVisuals();
    initSection1();
    if (sweepData?.sweep) {
        const sweepCanvas = document.getElementById('sweep-chart-canvas');
        if (sweepCanvas) renderSweepChart(sweepCanvas, sweepData.sweep);
    }
}

// ===== Start =====
document.addEventListener('DOMContentLoaded', init);
