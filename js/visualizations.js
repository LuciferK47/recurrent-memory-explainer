/**
 * visualizations.js — All rendering code for the explainer
 *
 * Handles: memory heatmap, truth-vs-recall table, capacity gauge,
 * KV-cache growth animation, interference curve charts.
 *
 * All visualizations use Canvas 2D for performance.
 */

// ===== Color Utilities for Light Editorial / Instrument Aesthetic =====

/**
 * Map a value in [-max, max] to a diverging colorscale on light background.
 * Neutral (0) is a clean light linen (#f0f2ee).
 * Positive is warm terracotta/vermilion (#c04928).
 * Negative is deep cobalt/signal blue (#1d6fa5).
 */
export function divergingColor(value, maxAbs) {
    const t = Math.max(-1, Math.min(1, value / (maxAbs || 1)));
    if (t >= 0) {
        // Linen (#f0f2ee) -> Terracotta (#c04928)
        const r = Math.round(240 - t * (240 - 192));
        const g = Math.round(242 - t * (242 - 73));
        const b = Math.round(238 - t * (238 - 40));
        return `rgb(${r},${g},${b})`;
    } else {
        // Linen (#f0f2ee) -> Deep Cobalt (#1d6fa5)
        const s = -t;
        const r = Math.round(240 - s * (240 - 29));
        const g = Math.round(242 - s * (242 - 111));
        const b = Math.round(238 - s * (238 - 165));
        return `rgb(${r},${g},${b})`;
    }
}

/**
 * Similarity → color string (high contrast for light background)
 */
export function similarityColor(sim) {
    if (sim >= 0.9) return '#1b7a4e'; // ground truth emerald
    if (sim >= 0.7) return '#d97706'; // warm amber
    if (sim >= 0.5) return '#ea580c'; // deep orange
    return '#c04928'; // terracotta red
}

/**
 * Similarity → CSS class for table rows
 */
export function similarityClass(sim) {
    if (sim >= 0.9) return 'sim-high';
    if (sim >= 0.7) return 'sim-medium';
    return 'sim-low';
}

// ===== Memory Heatmap =====

/**
 * Render a d×d matrix as a heatmap on a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {number[][]} matrix - 2D array of values
 */
export function renderHeatmap(canvas, matrix) {
    const ctx = canvas.getContext('2d');
    const dim = matrix.length;
    if (dim === 0) return;

    // Size canvas to container
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth, container.clientHeight) || 280;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    // Find max absolute value for color scaling
    let maxAbs = 0;
    for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
            maxAbs = Math.max(maxAbs, Math.abs(matrix[i][j]));
        }
    }
    if (maxAbs < 1e-10) maxAbs = 1;

    const cellSize = size / dim;
    const gap = Math.max(1, cellSize * 0.06);

    ctx.clearRect(0, 0, size, size);

    // Clean instrument matrix background
    ctx.fillStyle = '#f9faf7';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
            ctx.fillStyle = divergingColor(matrix[i][j], maxAbs);
            const x = j * cellSize + gap / 2;
            const y = i * cellSize + gap / 2;
            const w = cellSize - gap;
            const h = cellSize - gap;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 2);
            ctx.fill();

            // Subtle cell border
            ctx.strokeStyle = '#dee2de';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }
}

// ===== Truth vs Recall Table =====

/**
 * Update the truth-vs-recall table.
 * @param {HTMLElement} tbody - Table body element
 * @param {Array<{label: string, similarity: number}>} recalls
 */
export function updateTruthTable(tbody, recalls) {
    if (recalls.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="color: var(--text-muted); text-align: center; padding: 2rem;">Click "Add Random Pair" to begin</td></tr>';
        return;
    }

    tbody.innerHTML = recalls.map((r, i) => {
        const sim = r.similarity;
        const pct = Math.round(sim * 100);
        const cls = similarityClass(sim);
        const color = similarityColor(sim);
        const status = sim >= 0.9 ? '✓ Accurate' : sim >= 0.7 ? '⚠ Degraded' : '✗ Corrupted';

        return `
            <tr>
                <td style="color: var(--text-primary);">${r.label}</td>
                <td>
                    <div class="similarity-bar ${cls}">
                        <div class="bar"><div class="bar-fill" style="width: ${pct}%"></div></div>
                        <span style="color: ${color}; font-weight: 600;">${pct}%</span>
                    </div>
                </td>
                <td style="color: ${color}; font-size: 0.75rem;">${status}</td>
            </tr>
        `;
    }).join('');
}

// ===== Capacity Display =====

/**
 * Update the capacity bar and display.
 * @param {number} ratio - stored / dim
 */
export function updateCapacityDisplay(ratio) {
    const bar = document.getElementById('capacity-bar');
    const display = document.getElementById('capacity-display');
    if (!bar || !display) return;

    const pct = Math.min(ratio * 100, 400); // cap visual at 4x
    display.textContent = ratio.toFixed(2);

    bar.style.width = Math.min(pct, 100) + '%';

    if (ratio <= 0.5) {
        bar.style.background = 'var(--signal-holding)';
        display.style.color = 'var(--signal-holding)';
    } else if (ratio <= 1.0) {
        bar.style.background = 'var(--signal-amber)';
        display.style.color = 'var(--signal-amber)';
    } else {
        bar.style.background = 'var(--signal-decay)';
        display.style.color = 'var(--signal-decay)';
    }
}

// ===== KV-Cache Growth Animation (Calibrated Real Axes) =====

/**
 * Draw the KV-cache growth comparison (Section 1).
 * Sequence Length (0 to 8,192 tokens) vs Memory Footprint (0 to 256 MB).
 * @param {HTMLCanvasElement} canvas
 * @param {number} frame - animation frame [0, 1]
 */
export function renderKVGrowth(canvas, frame = 1) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth || 400;
    const h = 230;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const padding = { left: 65, right: 30, top: 25, bottom: 45 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // Background plane
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(padding.left, padding.top, plotW, plotH);

    // Y Grid & Ticks (Memory in MB: 0 to 256 MB)
    const yTicks = [
        { val: 0, label: '0 MB' },
        { val: 64, label: '64 MB' },
        { val: 128, label: '128 MB' },
        { val: 192, label: '192 MB' },
        { val: 256, label: '256 MB' }
    ];

    ctx.lineWidth = 1;
    for (const t of yTicks) {
        const y = padding.top + plotH * (1 - t.val / 256);
        ctx.strokeStyle = '#dee2de';
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + plotW, y);
        ctx.stroke();

        ctx.fillStyle = '#646464';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(t.label, padding.left - 8, y + 4);
    }

    // X Grid & Ticks (Tokens: 0 to 8k)
    const xTicks = [
        { val: 0, label: '0' },
        { val: 2048, label: '2k' },
        { val: 4096, label: '4k' },
        { val: 6144, label: '6k' },
        { val: 8192, label: '8k' }
    ];

    for (const t of xTicks) {
        const x = padding.left + (t.val / 8192) * plotW;
        ctx.strokeStyle = '#dee2de';
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + plotH);
        ctx.stroke();

        ctx.fillStyle = '#646464';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.label, x, h - padding.bottom + 16);
    }

    // Plot Border
    ctx.strokeStyle = '#b4b8b4';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding.left, padding.top, plotW, plotH);

    // Axis Titles
    ctx.fillStyle = '#444141';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sequence Length (tokens)', padding.left + plotW / 2, h - 8);

    ctx.save();
    ctx.translate(16, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Memory Footprint (MB)', 0, 0);
    ctx.restore();

    // Data Curve: KV-Cache Linear Growth O(n)
    const animTokens = 8192 * Math.max(0.01, Math.min(1, frame));
    const animX = padding.left + (animTokens / 8192) * plotW;
    const animMB = (animTokens / 8192) * 256;
    const animY = padding.top + plotH * (1 - animMB / 256);

    // Shaded triangle below curve
    ctx.fillStyle = 'rgba(192, 73, 40, 0.08)';
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + plotH);
    ctx.lineTo(animX, animY);
    ctx.lineTo(animX, padding.top + plotH);
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = '#c04928';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + plotH);
    ctx.lineTo(animX, animY);
    ctx.stroke();

    // Head point & live readout
    ctx.fillStyle = '#c04928';
    ctx.beginPath();
    ctx.arc(animX, animY, 4, 0, Math.PI * 2);
    ctx.fill();

    if (frame > 0.15) {
        ctx.fillStyle = '#171717';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = animX > padding.left + plotW * 0.7 ? 'right' : 'left';
        const textX = animX > padding.left + plotW * 0.7 ? animX - 10 : animX + 10;
        ctx.fillText(`O(n): ${animMB.toFixed(1)} MB @ ${Math.round(animTokens).toLocaleString()} tok`, textX, animY - 8);
    }
}

/**
 * Draw the fixed-state constant line (Section 1).
 * Sequence Length (0 to 8,192 tokens) vs Constant Memory (8.0 MB).
 * @param {HTMLCanvasElement} canvas
 * @param {number} frame
 */
export function renderFixedState(canvas, frame = 1) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth || 400;
    const h = 230;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const padding = { left: 65, right: 30, top: 25, bottom: 45 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // Background plane
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(padding.left, padding.top, plotW, plotH);

    // Y Grid & Ticks (Same scale 0 to 256 MB for direct fair comparison!)
    const yTicks = [
        { val: 0, label: '0 MB' },
        { val: 64, label: '64 MB' },
        { val: 128, label: '128 MB' },
        { val: 192, label: '192 MB' },
        { val: 256, label: '256 MB' }
    ];

    ctx.lineWidth = 1;
    for (const t of yTicks) {
        const y = padding.top + plotH * (1 - t.val / 256);
        ctx.strokeStyle = '#dee2de';
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + plotW, y);
        ctx.stroke();

        ctx.fillStyle = '#646464';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(t.label, padding.left - 8, y + 4);
    }

    // X Grid & Ticks
    const xTicks = [
        { val: 0, label: '0' },
        { val: 2048, label: '2k' },
        { val: 4096, label: '4k' },
        { val: 6144, label: '6k' },
        { val: 8192, label: '8k' }
    ];

    for (const t of xTicks) {
        const x = padding.left + (t.val / 8192) * plotW;
        ctx.strokeStyle = '#dee2de';
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + plotH);
        ctx.stroke();

        ctx.fillStyle = '#646464';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.label, x, h - padding.bottom + 16);
    }

    // Plot Border
    ctx.strokeStyle = '#b4b8b4';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding.left, padding.top, plotW, plotH);

    // Axis Titles
    ctx.fillStyle = '#444141';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sequence Length (tokens)', padding.left + plotW / 2, h - 8);

    ctx.save();
    ctx.translate(16, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Memory Footprint (MB)', 0, 0);
    ctx.restore();

    // Constant 8.0 MB line
    const fixedMB = 8.0;
    const fixedY = padding.top + plotH * (1 - fixedMB / 256);
    const animX = padding.left + Math.max(0.01, Math.min(1, frame)) * plotW;

    // Subtle shaded band for fixed recurrent state
    ctx.fillStyle = 'rgba(29, 111, 165, 0.08)';
    ctx.fillRect(padding.left, fixedY, animX - padding.left, padding.top + plotH - fixedY);

    // Fixed line
    ctx.strokeStyle = '#1d6fa5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, fixedY);
    ctx.lineTo(animX, fixedY);
    ctx.stroke();

    // Head point & live readout
    ctx.fillStyle = '#1d6fa5';
    ctx.beginPath();
    ctx.arc(animX, fixedY, 4, 0, Math.PI * 2);
    ctx.fill();

    if (frame > 0.15) {
        ctx.fillStyle = '#171717';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`O(1): ${fixedMB.toFixed(1)} MB (constant state)`, padding.left + 15, fixedY - 10);
    }
}

// ===== Interference Curve Chart (Real Calibrated Axes) =====

const DIM_COLORS = {
    '4': '#c04928',  // Terracotta Vermilion
    '8': '#d97706',  // Warm Amber
    '16': '#1b7a4e', // Forest Emerald
    '32': '#1d6fa5', // Deep Cobalt
    '64': '#7c3aed', // Editorial Violet
};

/**
 * Render the precomputed interference sweep chart with real axes, units, and ticks.
 * @param {HTMLCanvasElement} canvas
 * @param {Object} sweepData - from interference_sweep.json
 */
export function renderSweepChart(canvas, sweepData) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;
    const w = container.clientWidth || 600;
    const h = 320;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const padding = { left: 65, right: 30, top: 25, bottom: 50 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // Clean paper background plane
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(padding.left, padding.top, plotW, plotH);

    const maxRatio = 4.0;

    // Y Grid & Ticks (Mean Cosine Similarity: 0.0 to 1.0)
    ctx.lineWidth = 1;
    for (let y = 0; y <= 1.01; y += 0.2) {
        const py = padding.top + plotH * (1 - y);
        ctx.strokeStyle = '#dee2de';
        ctx.beginPath();
        ctx.moveTo(padding.left, py);
        ctx.lineTo(padding.left + plotW, py);
        ctx.stroke();

        ctx.fillStyle = '#646464';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(y.toFixed(1), padding.left - 8, py + 4);
    }

    // X Grid & Ticks (Capacity Ratio n / d: 0x to 4x)
    for (let x = 0; x <= maxRatio + 0.01; x += 1) {
        const px = padding.left + (x / maxRatio) * plotW;
        ctx.strokeStyle = '#dee2de';
        ctx.beginPath();
        ctx.moveTo(px, padding.top);
        ctx.lineTo(px, padding.top + plotH);
        ctx.stroke();

        ctx.fillStyle = '#646464';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(x.toFixed(0) + 'x', px, h - padding.bottom + 18);
    }

    // Capacity line at x = 1.0 (n = d rank threshold)
    const capX = padding.left + (1.0 / maxRatio) * plotW;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#282834';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(capX, padding.top);
    ctx.lineTo(capX, padding.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Capacity line label banner
    ctx.fillStyle = '#282834';
    ctx.font = '600 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('n = d (Rank Limit)', capX, padding.top - 8);

    // Plot Border
    ctx.strokeStyle = '#b4b8b4';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding.left, padding.top, plotW, plotH);

    // Axis Titles
    ctx.fillStyle = '#2c2c2c';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Capacity Ratio (n / d) — Stored Pairs Normalized by Dimension', padding.left + plotW / 2, h - 8);

    ctx.save();
    ctx.translate(16, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Mean Recall Cosine Similarity', 0, 0);
    ctx.restore();

    // Data curves
    for (const d of Object.keys(sweepData)) {
        const data = sweepData[d].data;
        const color = DIM_COLORS[d] || '#444141';

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        let started = false;
        for (const pt of data) {
            if (pt.capacity_ratio > maxRatio) continue;
            const x = padding.left + (pt.capacity_ratio / maxRatio) * plotW;
            const y = padding.top + plotH * (1 - pt.mean);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Data point markers
        ctx.fillStyle = color;
        for (const pt of data) {
            if (pt.capacity_ratio > maxRatio) continue;
            const x = padding.left + (pt.capacity_ratio / maxRatio) * plotW;
            const y = padding.top + plotH * (1 - pt.mean);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Legend
    const legend = document.getElementById('sweep-legend');
    if (legend) {
        legend.innerHTML = Object.entries(DIM_COLORS).map(([d, c]) =>
            `<span style="display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;font-weight:500;color:#2c2c2c;padding:3px 8px;background:#f9faf7;border:1px solid #dee2de;border-radius:4px;">
                <span style="width:12px;height:3px;background:${c};border-radius:2px;display:inline-block;"></span>
                <span style="font-family:'JetBrains Mono',monospace;">d=${d}</span>
            </span>`
        ).join('');
    }
}

// ===== Live Overload Chart (Real Calibrated Axes) =====

/**
 * Render the live overload experiment chart (mean recall vs. stored count).
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{n: number, recall: number}>} history
 * @param {number} dim
 */
export function renderOverloadChart(canvas, history, dim) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;
    const w = container.clientWidth || 600;
    const h = 260;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const padding = { left: 65, right: 30, top: 25, bottom: 45 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // Clean background plane
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(padding.left, padding.top, plotW, plotH);

    if (history.length === 0) {
        // Grid on empty state
        ctx.strokeStyle = '#dee2de';
        ctx.strokeRect(padding.left, padding.top, plotW, plotH);
        ctx.fillStyle = '#646464';
        ctx.font = '13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Click "+ Add Pair" or "Flood (+20)" to sample live recall degradation', padding.left + plotW / 2, padding.top + plotH / 2);
        return;
    }

    const currentN = history[history.length - 1].n;
    const maxN = Math.max(dim * 3, currentN + 2);

    // Y Grid & Ticks (Recall Similarity: 0.0 to 1.0)
    ctx.lineWidth = 1;
    for (let y = 0; y <= 1.01; y += 0.25) {
        const py = padding.top + plotH * (1 - y);
        ctx.strokeStyle = '#dee2de';
        ctx.beginPath();
        ctx.moveTo(padding.left, py);
        ctx.lineTo(padding.left + plotW, py);
        ctx.stroke();

        ctx.fillStyle = '#646464';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(y.toFixed(2), padding.left - 8, py + 4);
    }

    // Capacity vertical line at n = dim
    const capX = padding.left + (dim / maxN) * plotW;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#282834';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(capX, padding.top);
    ctx.lineTo(capX, padding.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#282834';
    ctx.font = '600 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Capacity (n = d = ${dim})`, capX, padding.top - 8);

    // Plot Border
    ctx.strokeStyle = '#b4b8b4';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding.left, padding.top, plotW, plotH);

    // Axis Labels
    ctx.fillStyle = '#444141';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Number of Stored Associations (n)', padding.left + plotW / 2, h - 8);

    ctx.save();
    ctx.translate(16, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Mean Recall', 0, 0);
    ctx.restore();

    // Data Line
    ctx.strokeStyle = '#1d6fa5';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
        const x = padding.left + (history[i].n / maxN) * plotW;
        const y = padding.top + plotH * (1 - Math.max(0, history[i].recall));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dots colored by signal quality
    for (let i = 0; i < history.length; i++) {
        const x = padding.left + (history[i].n / maxN) * plotW;
        const y = padding.top + plotH * (1 - Math.max(0, history[i].recall));
        ctx.fillStyle = similarityColor(history[i].recall);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
}

// ===== ARC Grid Rendering =====

const ARC_COLORS = {
    0: '#1a1a2e',
    1: '#e74c3c',
    2: '#2ecc71',
    3: '#3498db',
    4: '#f39c12',
    5: '#9b59b6',
    6: '#e91e63',
    7: '#ff5722',
    8: '#00bcd4',
    9: '#8bc34a',
};

/**
 * Render an ARC-style grid into a container element.
 * @param {HTMLElement} container
 * @param {number[][]} grid
 * @param {string} [label]
 */
export function renderARCGrid(container, grid, label = '') {
    const rows = grid.length;
    const cols = grid[0].length;

    const wrapper = document.createElement('div');
    wrapper.style.textAlign = 'center';

    if (label) {
        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-size:0.7rem;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;';
        lbl.textContent = label;
        wrapper.appendChild(lbl);
    }

    const gridEl = document.createElement('div');
    gridEl.className = 'arc-grid';
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'arc-cell';
            cell.style.backgroundColor = ARC_COLORS[grid[r][c]] || ARC_COLORS[0];
            gridEl.appendChild(cell);
        }
    }

    wrapper.appendChild(gridEl);
    container.appendChild(wrapper);
}

/**
 * Render an arrow element between grids.
 * @param {HTMLElement} container
 */
export function renderARCArrow(container) {
    const arrow = document.createElement('div');
    arrow.className = 'arc-arrow';
    arrow.textContent = '→';
    container.appendChild(arrow);
}
