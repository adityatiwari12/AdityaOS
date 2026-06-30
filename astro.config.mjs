// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Replace with your website URL (required for sitemap generation)
  site: process.env.PUBLIC_SITE_URL || 'https://adityatiwari.work',

  // URL configuration
  trailingSlash: 'never', // Removes trailing slashes from URLs

  // Vite configuration
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'AdityaOS',
          short_name: 'AdityaOS',
          description: 'Aditya Tiwari — Interactive Portfolio Operating System',
          theme_color: '#0f0c29',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            { src: '/favicon.ico', sizes: '64x64', type: 'image/x-icon' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /\/_astro\/.+\.js$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'astro-chunks',
                expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 },
                networkTimeoutSeconds: 5,
              },
            },
          ],
        },
      }),
    ],
  },

  // Required integrations
  integrations: [
    react(), // Enables React components
    sitemap({
      // Generates sitemap
      serialize: (item) => {
        const url = item.url.endsWith('/') ? item.url.slice(0, -1) : item.url;
        return { ...item, url };
      },
    }),
  ],

  // Deployment configuration
  output: 'server', // Server-side rendering - required for OpenAI API usage
  adapter: vercel(), // Deploy to Vercel - optional
  devToolbar: {
    enabled: false,
  },
});
