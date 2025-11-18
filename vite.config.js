import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },
  proxy: {
    '/firebase-proxy': {
      target: 'https://firebasestorage.googleapis.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/firebase-proxy/, '')
    }
  }
})

