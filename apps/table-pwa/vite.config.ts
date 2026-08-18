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
      workbox: {
        // Never cache API/WebSocket calls - menu/order data must always be fresh.
        navigateFallbackDenylist: [/^\/(orders|menu|tables|auth)\//],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
