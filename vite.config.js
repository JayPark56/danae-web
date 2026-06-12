import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vercel serves the static build from dist/; base '/' keeps asset URLs
// root-relative. The SPA fallback rewrite lives in vercel.json — the app
// itself has no client-side routes (pages swap via state, only '/' is
// navigated), so the rewrite only matters if routes are added later.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
