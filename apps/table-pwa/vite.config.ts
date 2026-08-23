import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Table PWA: guests reach this purely by scanning a table's QR code, so it
// must install-prompt cleanly and cache the app shell for spotty
// restaurant Wi-Fi - hence vite-plugin-pwa rather than a plain SPA build.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // A hand-written service worker (src/sw.ts) instead of the default
      // generated one - needed to add a `push` event handler for order-
      // status notifications. precacheAndRoute keeps the same app-shell
      // offline caching the generated worker used to provide; there's no
      // navigation-fallback route here, so there's nothing that could ever
      // serve stale API data - the "never cache API calls" concern the old
      // config's navigateFallbackDenylist addressed doesn't apply anymore.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Table Order',
        short_name: 'Order',
        description: 'Scan, order, and track your table’s food from your phone.',
        theme_color: '#EA580C',
        background_color: '#FFFBF5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
