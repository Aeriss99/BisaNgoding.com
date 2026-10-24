import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const versi = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : 'lokal';
const waktuBuild = new Date().toISOString();

// https://vite.dev/config/
export default defineConfig({
  define: {
    __VERSI_APP__: JSON.stringify(versi),
    __WAKTU_BUILD__: JSON.stringify(waktuBuild),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'version-file',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ versi, dibuat: waktuBuild }, null, 2),
        });
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      workbox: {
        globIgnores: ['**/version.json'],
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 8000000,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/audio/en/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'suara-en',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
      manifest: {
        name: 'BisaNgoding Belajar Java',
        short_name: 'BisaNgoding',
        description: 'Website belajar Java interaktif gratis.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  base: process.env.GITHUB_PAGES === 'true' ? '/BisaNgoding.com/' : '/',
  build: {
    rollupOptions: {
      output: {
        // Materi (content/<kelas>/...) dipecah menjadi satu file per kelas. Tanpa ini semua materi
        // masuk ke satu file utama yang terus membesar dan melewati batas precache PWA (8 MB).
        manualChunks(id) {
          const kelas = id.match(/[\\/]content[\\/]([^\\/]+)[\\/]/);
          if (kelas) return `materi-${kelas[1]}`;
        },
      },
    },
  },
});
