/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0C0E',               // Deep charcoal void
        surface: '#13161F',              // Dark slate card surface
        'surface-elevated': '#1A1F2C',   // Elevated interactive instrument surface
        linen: '#171B26',                // Dark subtle panel wash
        ink: '#F8FAFC',                  // Crisp off-white primary text
        'ink-muted': '#94A3B8',          // Secondary muted slate
        'ink-faint': '#64748B',          // Micro accents / captions
        border: 'rgba(255, 255, 255, 0.08)', // Fine hairline border
        'border-hover': 'rgba(255, 255, 255, 0.18)',
        memory: '#00D2FF',               // Electric cyan: memory state / recurrent
        'memory-dark': '#0099CC',
        'memory-glow': 'rgba(0, 210, 255, 0.25)',
        interference: '#FF4D4D',         // Electric crimson: interference / decay
        'interference-glow': 'rgba(255, 77, 77, 0.25)',
        truth: '#00E5A3',                // Electric emerald: ground truth / recall
        'truth-glow': 'rgba(0, 229, 163, 0.25)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Departure Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 210, 255, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(0, 229, 163, 0.3)',
        'glow-crimson': '0 0 25px -5px rgba(255, 77, 77, 0.3)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}
