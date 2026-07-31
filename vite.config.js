import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // maplibre-gl ships its own web worker. Vite's dep pre-bundler rewrites the
    // worker entry and then cannot resolve it, so tiles never get parsed and the
    // style never finishes loading. Excluding it leaves the package's own worker
    // resolution alone.
    exclude: ["maplibre-gl"],
  },
})
