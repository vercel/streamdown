import { defineConfig } from 'tsup';

export default defineConfig({
  dts: true,
  entry: ['scripts/index.tsx'],
  format: ['cjs', 'esm'],
  minify: true,
  outDir: 'dist',
  sourcemap: false,
});