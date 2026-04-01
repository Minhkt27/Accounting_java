import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true, // Cố định cổng 3000
    watch: {
      usePolling: true, // Required for Docker on Windows
    },
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:8888',
        changeOrigin: true,
      }
    }
  }
})
