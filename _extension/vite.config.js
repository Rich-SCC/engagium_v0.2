import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'popup/index': resolve(__dirname, 'popup/index.html'),
        'options/index': resolve(__dirname, 'options/index.html'),
        'options/callback': resolve(__dirname, 'options/callback.html'),
        'background/service-worker': resolve(__dirname, 'background/service-worker.js'),
        'content/google-meet': resolve(__dirname, 'content/google-meet.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep service worker and content scripts in their proper locations
          if (chunkInfo.name.includes('service-worker')) {
            return 'background/service-worker.js';
          }
          if (chunkInfo.name.includes('google-meet')) {
            return 'content/google-meet.js';
          }
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep CSS files organized
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
        format: 'es'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './')
    }
  }
});
