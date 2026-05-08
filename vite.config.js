import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SERVER_URL = "https://smarthrmanagementsystem.vercel.app";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: SERVER_URL,
        changeOrigin: true,
      },
      "/uploads": {
        target: SERVER_URL,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  }
})
