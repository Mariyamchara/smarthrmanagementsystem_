import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const API_BASE_URL = "https://smart-hr-management-system-two.vercel.app";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: API_BASE_URL,
        changeOrigin: true,
      },
      "/uploads": {
        target: API_BASE_URL,
        changeOrigin: true,
      },
    },
  },
})
