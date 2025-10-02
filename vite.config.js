import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 100, // Check every 100ms
    },
    host: true, // Listen on all addresses
    strictPort: true,
    port: 5173,
  },
})
