import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/recurrent-memory-explainer/' : '/',
  build: {
    rollupOptions: {
      output: {
        // React/react-dom change far less often than the app's own code and
        // are the same across every route — splitting them into their own
        // chunk lets browsers cache them independently of app-code redeploys.
        // A function, not the {vendor: ['react','react-dom']} shorthand: the
        // shorthand matches bare specifiers only, and main.tsx imports the
        // 'react-dom/client' subpath, which it doesn't catch.
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/scheduler')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
