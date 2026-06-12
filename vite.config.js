import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vercel serves the static build from dist/ with SPA fallback; base '/' keeps
// asset URLs root-relative, which is what Vercel expects.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
