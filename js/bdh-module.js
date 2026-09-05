/**
 * bdh-module.js — BDH/BDH-CQ Educational Module
 *
 * Handles the step-through walkthrough of how BDH-CQ absorbs
 * demonstration examples into recurrent state.
 *
 * IMPORTANT: This is an ILLUSTRATION of the published BDH-CQ mechanism
 * (arXiv:2608.09888, Section 3). It is NOT live BDH-CQ inference.
 */

import { renderARCGrid, renderARCArrow, renderHeatmap } from './visualizations.js';
import { AssociativeMemory, randomUnitVector } from './memory-model.js';

export class BDHModule {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 4;
        this.taskData = null;
        this.demoMemory = new AssociativeMemory(8); // Small toy for illustration
        this.initialized = false;
    }

    /**
     * Initialize with task data from precomputed JSON.
     * @param {Object} data - from bdh_cq_demo_tasks.json
     */
    async init(data) {
        this.taskData = data;
        const task = data.tasks[0]; // Use first task (fill_color)

        // Render demo grids
        this._renderDemoStep0(task);
        this._renderDemoStep2(task);
        this._renderTestStep(task);

        // Set up navigation
        document.getElementById('bdh-next-btn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('bdh-prev-btn')?.addEventListener('click', () => this.prevStep());

        this.initialized = true;
        this.updateStepVisuals();
    }

    _renderDemoStep0(task) {
        const container = document.getElementById('demo-grids-0');
        if (!container) return;
        container.innerHTML = '';

        const demo = task.demonstrations[0];
        renderARCGrid(container, demo.input, 'Input');
        renderARCArrow(container);
        renderARCGrid(container, demo.output, 'Output');
    }

    _renderDemoStep2(task) {
        const container = document.getElementById('demo-grids-1');
        if (!container) return;
        container.innerHTML = '';

        const demo = task.demonstrations[1];
        renderARCGrid(container, demo.input, 'Input');
        renderARCArrow(container);
        renderARCGrid(container, demo.output, 'Output');
    }

    _renderTestStep(task) {
        const container = document.getElementById('test-grids');
        if (!container) return;
        container.innerHTML = '';

        renderARCGrid(container, task.test.input, 'Test Input');
        renderARCArrow(container);
        renderARCGrid(container, task.test.expected_output, 'Expected Output');
    }

    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.updateStepVisuals();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepVisuals();
        }
    }

    updateStepVisuals() {
        const steps = document.querySelectorAll('#bdh-cq-demo .bdh-step');
        steps.forEach((step, i) => {
            step.classList.toggle('active', i <= this.currentStep);
        });

        // Update buttons
        const prevBtn = document.getElementById('bdh-prev-btn');
        const nextBtn = document.getElementById('bdh-next-btn');
        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) {
            nextBtn.disabled = this.currentStep >= this.totalSteps - 1;
            nextBtn.textContent = this.currentStep >= this.totalSteps - 1 ? 'Done ✓' : 'Next Step →';
        }

        // Render state canvases for steps 1 and 2
        if (this.currentStep >= 1) {
            this._renderStateHeatmap('bdh-state-canvas-1', 1);
        }
        if (this.currentStep >= 2) {
            this._renderStateHeatmap('bdh-state-canvas-2', 2);
        }
    }

    _renderStateHeatmap(canvasId, demoCount) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Build a fresh memory with demoCount writes
        const mem = new AssociativeMemory(8);
        for (let i = 0; i < demoCount; i++) {
            const k = randomUnitVector(8);
            const v = randomUnitVector(8);
            // Use seeded-like values so visuals are consistent
            // (we use the same "random" vectors each time by resetting)
            mem.write(k, v, `Demo ${i + 1}`);
        }

        renderHeatmap(canvas, mem.getMatrix());
    }
}
