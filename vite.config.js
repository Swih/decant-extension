import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { copyFileSync, mkdirSync } from 'fs';
import manifest from './manifest.json';
import { resolve } from 'path';

/** Copy content scripts to dist (not bundled by Vite — injected on-demand via scripting API) */
function copyContentScript() {
  return {
    name: 'copy-content-script',
    writeBundle() {
      mkdirSync(resolve(__dirname, 'dist/src/content'), { recursive: true });
      copyFileSync(
        resolve(__dirname, 'src/content/extractor.js'),
        resolve(__dirname, 'dist/src/content/extractor.js'),
      );
      copyFileSync(
        resolve(__dirname, 'src/content/dom-picker.js'),
        resolve(__dirname, 'dist/src/content/dom-picker.js'),
      );
    },
  };
}

export default defineConfig({
  plugins: [
    crx({ manifest }),
    copyContentScript(),
  ],
  build: {
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/panel.html'),
        onboarding: resolve(__dirname, 'src/onboarding/welcome.html'),
        privacy: resolve(__dirname, 'src/privacy/privacy.html'),
        offscreen: resolve(__dirname, 'src/offscreen/offscreen.html'),
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
