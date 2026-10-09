import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  fixedExtension: false,
  dts: true,
  clean: true,
  sourcemap: true,
  deps: { neverBundle: [/^react(?:\/.*)?$/, /^react-dom(?:\/.*)?$/] },
  // Bundlers can otherwise discard the directive from a source barrel.
  banner: { js: '"use client";' },
});
