/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Every color resolves a CSS custom property defined in src/index.css.
      // One dark palette; `.instrument-panel` rescopes the ground tokens
      // (canvas/surface/surface-raised/surface-elevated/linen) one step
      // deeper for recessed-well surfaces (Hero's diagram, the two document
      // modals) — see index.css for the full explanation. Token NAMES are
      // unchanged from the original two-palette version so no component
      // needed editing for the flip.
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        linen: 'rgb(var(--color-linen) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-ink-muted) / <alpha-value>)',
        'ink-faint': 'rgb(var(--color-ink-faint) / <alpha-value>)',
        // Hairline borders keep a fixed low bake-in alpha (0.08 / 0.18) so the
        // existing /60 /70 /80 modifiers stay subtle in BOTH palettes, rather
        // than resolving to a heavy 80%-opaque line on a solid ink color.
        border: 'rgb(var(--color-border) / 0.08)',
        'border-hover': 'rgb(var(--color-border) / 0.18)',
        memory: 'rgb(var(--color-memory) / <alpha-value>)',
        'memory-dark': 'rgb(var(--color-memory-dark) / <alpha-value>)',
        'memory-glow': 'rgb(var(--color-memory) / 0.25)',
        interference: 'rgb(var(--color-interference) / <alpha-value>)',
        'interference-glow': 'rgb(var(--color-interference) / 0.25)',
        truth: 'rgb(var(--color-truth) / <alpha-value>)',
        'truth-glow': 'rgb(var(--color-truth) / 0.25)',
        // New semantic hues: BDH/synaptic (purple) and precomputed/provenance (amber-brown)
        synapse: 'rgb(var(--color-synapse) / <alpha-value>)',
        'synapse-glow': 'rgb(var(--color-synapse) / 0.25)',
        data: 'rgb(var(--color-data) / <alpha-value>)',
        'data-glow': 'rgb(var(--color-data) / 0.25)',
      },
      fontFamily: {
        display: ['"Departure Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"Departure Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 16px -6px rgb(var(--color-memory) / 0.35)',
        'glow-cyan': '0 0 25px -5px rgba(0, 210, 255, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(52, 211, 153, 0.3)',
        'glow-crimson': '0 0 25px -5px rgba(255, 107, 107, 0.3)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Background aurora glows (ScaleFreeBackground.tsx) — three
        // independent slow drifts so the three blobs never move in lockstep.
        auroraA: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(4%, 6%) scale(1.08)' },
        },
        auroraB: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-5%, 4%) scale(1.05)' },
        },
        auroraC: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(3%, -5%) scale(1.1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out both',
        'aurora-a': 'auroraA 38s ease-in-out infinite',
        'aurora-b': 'auroraB 46s ease-in-out infinite',
        'aurora-c': 'auroraC 42s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
