import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Personal-Idea/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'Saku — 4-in-1 Micro-Utility',
        short_name: 'Saku',
        description: '4 utilitas mikro offline-first tanpa friksi dalam satu layar OLED.',
        start_url: '/Personal-Idea/?tab=keluar',
        scope: '/Personal-Idea/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        orientation: 'portrait',
        icons: [
          {
            src: '/Personal-Idea/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/Personal-Idea/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Aman Keluar',
            short_name: 'Keluar',
            description: 'Cek 5 detik sebelum berangkat',
            url: '/Personal-Idea/?tab=keluar',
            icons: [{ src: '/Personal-Idea/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }]
          },
          {
            name: 'The Breathing Door',
            short_name: 'Napas',
            description: 'Jeda 8 detik anti-doomscroll',
            url: '/Personal-Idea/?tab=napas',
            icons: [{ src: '/Personal-Idea/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }]
          },
          {
            name: 'Kapan Terakhir',
            short_name: 'Terakhir',
            description: 'Pelacak rutinitas & perawatan',
            url: '/Personal-Idea/?tab=terakhir',
            icons: [{ src: '/Personal-Idea/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }]
          },
          {
            name: 'Parkir & Simpan',
            short_name: 'Simpan',
            description: 'Spot parkir & lokasi barang',
            url: '/Personal-Idea/?tab=simpan',
            icons: [{ src: '/Personal-Idea/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: []
      }
    })
  ]
});
