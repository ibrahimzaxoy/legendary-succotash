import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Hand-written service worker (src/sw.ts) for a `push` event handler -
      // see the Table PWA's identical setup for the full rationale.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Order Delivery & Pickup',
        short_name: 'Order',
        description: 'Order food for delivery or pickup.',
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
    port: 5176,
  },
});
