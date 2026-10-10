import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'site',
  plugins: [
    react(),
    {
      name: 'verify-built-library-boundary',
      apply: 'build',
      generateBundle() {
        const modules = [...this.getModuleIds()];
        if (!modules.some((id) => id.endsWith('/dist/index.js'))) {
          this.error('The public site must consume the built library root.');
        }
        if (
          modules.some((id) =>
            id.startsWith(resolve(import.meta.dirname, 'src') + '/'),
          )
        ) {
          this.error(
            'Library source imports are forbidden in the public site.',
          );
        }
      },
    },
  ],
  // Package self-reference resolves the real root export to dist/index.js.
  // There is deliberately no source alias.
  resolve: { dedupe: ['react', 'react-dom'] },
  build: {
    outDir: '../site-dist',
    emptyOutDir: true,
    sourcemap: true,
    rolldownOptions: {
      input: {
        home: resolve(import.meta.dirname, 'site/index.html'),
        examples: resolve(import.meta.dirname, 'site/examples/index.html'),
        documentation: resolve(
          import.meta.dirname,
          'site/documentation/index.html',
        ),
        about: resolve(import.meta.dirname, 'site/about/index.html'),
      },
    },
  },
});
