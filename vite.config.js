import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip' }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['**/*'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
      manifest: {
        id: '/',
        name: 'WishFlow',
        short_name: 'WishFlow',
        description: 'Track and manage your wishlists easily.',
        lang: 'en',
        dir: 'ltr',
        orientation: 'any',
        categories: ['shopping', 'lifestyle', 'productivity'],
        theme_color: '#10367D',
        background_color: '#FFFFFF',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ],
        shortcuts: [
          {
            name: 'My Collections',
            short_name: 'Collections',
            description: 'View your wishlist collections',
            url: '/collections',
            icons: [{ src: '/192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Shared with Me',
            short_name: 'Shared',
            description: 'View shared collections',
            url: '/collections?tab=shared',
            icons: [{ src: '/192x192.png', sizes: '192x192' }]
          }
        ],
        screenshots: [
          // Mobile Screenshots (Narrow)
          {
            src: '/Screenshot/HomePageMobile.png',
            sizes: '339x749',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'WishFlow Mobile Dashboard'
          },
          {
            src: '/Screenshot/CollectionPageMobileAfter.png',
            sizes: '339x750',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'WishFlow Mobile Collections'
          },
          {
            src: '/Screenshot/ProductPageMobile.png',
            sizes: '338x752',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'WishFlow Mobile Product Details'
          },
          {
            src: '/Screenshot/PurchasedMobile.png',
            sizes: '341x752',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'WishFlow Mobile Purchased Items'
          },
          // Desktop Screenshots (Wide)
          {
            src: '/Screenshot/HomePageDesktop.png',
            sizes: '1407x755',
            type: 'image/png',
            form_factor: 'wide',
            label: 'WishFlow Desktop Dashboard'
          },
          {
            src: '/Screenshot/CollectionPageDesktopAfter.png',
            sizes: '1589x862',
            type: 'image/png',
            form_factor: 'wide',
            label: 'WishFlow Collections Management'
          },
          {
            src: '/Screenshot/ProductPageDesktop.png',
            sizes: '1581x856',
            type: 'image/png',
            form_factor: 'wide',
            label: 'WishFlow Product Details'
          },
          {
            src: '/Screenshot/PurchasedDesktop.png',
            sizes: '1536x849',
            type: 'image/png',
            form_factor: 'wide',
            label: 'WishFlow Purchased Items Tracking'
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
        enabled: true,
        type: 'module'
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
