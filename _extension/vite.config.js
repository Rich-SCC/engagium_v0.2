import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'background/service-worker': resolve(__dirname, 'background/service-worker.js'),
        'content/google-meet': resolve(__dirname, 'content/google-meet.js'),
        'popup/popup': resolve(__dirname, 'popup/popup.jsx'),
        'options/options': resolve(__dirname, 'options/options.jsx'),
        'options/callback': resolve(__dirname, 'options/callback.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
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
