/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#fefffc',       // one base background
        surface: '#ffffff',      // one card/panel background, one step off canvas
        linen: '#f9faf7',        // subtle wash, instrument headers
        ink: '#171717',          // primary text
        'ink-muted': '#646464',  // secondary text
        border: '#dee2de',       // hairline border, not shadows
        memory: '#1d6fa5',       // signal: state/O(1) — blue family
        interference: '#c04928', // signal: decay/O(n) — amber/red family
        truth: '#1b7a4e',        // signal: ground truth — green family
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"Departure Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
