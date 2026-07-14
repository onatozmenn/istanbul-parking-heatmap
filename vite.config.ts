import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const modulePath = id.replaceAll('\\', '/')
          if (!modulePath.includes('/node_modules/')) return undefined
          if (modulePath.includes('/maplibre-gl/') || modulePath.includes('/react-map-gl/')) {
            return 'map-vendor'
          }
          if (modulePath.includes('/@deck.gl/') || modulePath.includes('/@luma.gl/')) {
            return 'deck-vendor'
          }
          if (modulePath.includes('/@loaders.gl/') || modulePath.includes('/@math.gl/')) {
            return 'geo-vendor'
          }
          if (
            modulePath.includes('/react/') ||
            modulePath.includes('/react-dom/') ||
            modulePath.includes('/scheduler/')
          ) {
            return 'react-vendor'
          }
          return undefined
        },
      },
    },
  },
})
