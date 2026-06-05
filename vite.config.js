import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    // Only run the frontend suite — the backend has its own Jest tests in
    // server/ with their own dependencies (supertest, mongodb-memory-server).
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5005',
      '/uploads': 'http://localhost:5005',
    },
  },
})
