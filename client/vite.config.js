import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// During development the frontend calls relative `/api/...` URLs and Vite
// transparently proxies them to the Express server on :5050. This means the
// browser only ever talks to one origin (no CORS headaches in dev) and the API
// key never leaves the server. In production set VITE_API_BASE_URL instead.
const apiProxy = {
  '/api': {
    target: 'http://localhost:5050',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // The SW is inert in `vite dev`; test it with `build` + `preview`.
      devOptions: { enabled: false },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Atmosfer — Weather Dashboard',
        short_name: 'Atmosfer',
        description: 'A fast weather dashboard with a sky that matches the forecast.',
        theme_color: '#0b1f3a',
        background_color: '#0b1220',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Keep the last successful forecast available offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/weather'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('fonts.googleapis.com') ||
              url.hostname.includes('fonts.gstatic.com'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('tile.openstreetmap.org') ||
              url.hostname.includes('rainviewer.com'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  // `vite preview` (used to test the PWA build) also needs the API proxy.
  preview: {
    proxy: apiProxy,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
    setupFiles: ['./tests/setup.js'],
    // Component/hook tests need a DOM; pure util tests stay on fast node.
    environmentMatchGlobs: [
      ['tests/components/**', 'jsdom'],
      ['tests/hooks/**', 'jsdom'],
    ],
  },
});
