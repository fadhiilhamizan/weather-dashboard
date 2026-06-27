import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development the frontend calls relative `/api/...` URLs and Vite
// transparently proxies them to the Express server on :5050. This means the
// browser only ever talks to one origin (no CORS headaches in dev) and the API
// key never leaves the server. In production set VITE_API_BASE_URL instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
  },
});
