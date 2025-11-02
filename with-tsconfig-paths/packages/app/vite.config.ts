import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
export default defineConfig({
  plugins: [
    dts({
      include: ['../lib/src/**/*', 'src/**/*'],
      outDir: 'dist/types'
    })
  ],
  resolve: {
    alias: {
      '@test/lib': fileURLToPath(new URL('../lib/src', import.meta.url))
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'UnifiedLibrary',
      fileName: (format) => `unified-library.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
});
