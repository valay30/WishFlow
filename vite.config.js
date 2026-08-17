import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip' }),
    VitePWA({
      registerType: 'autoUpdate',
      // Cache ALL build assets so the app shell loads offline
      includeAssets: ['**/*'],
      workbox: {
        // Immediately claim all open tabs so the SW controls the page
        // right after installation — prevents white screen on offline refresh
        clientsClaim: true,
        skipWaiting: true,

        // Explicitly precache all build output (JS, CSS, HTML chunks)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],

        // When navigating to any route offline, serve the cached index.html
        // This lets React boot and show our custom OfflinePage
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],   // don't intercept API calls

        // Cache strategies
        runtimeCaching: [
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images (og-image, icons, etc.)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'WishFlow',
        short_name: 'WishFlow',
        description: 'Track and manage your wishlists easily.',
        theme_color: '#10367D',
        background_color: '#EBEBEB',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ],
        // ── Web Share Target API ──
        // This makes WishFlow appear in Android's native Share menu
        share_target: {
          action: '/share-target',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        }
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react']
        }
      }
    }
  }
});
