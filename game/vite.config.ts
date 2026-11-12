import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths so the built game also works from a subfolder (itch.io, GitHub Pages).
  base: './',
  server: {
    port: 5173,
  },
  build: {
    // Phaser alone is ~1.7 MB minified (~390 KB gzipped); that's expected, so don't warn about it.
    chunkSizeWarningLimit: 2000,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
