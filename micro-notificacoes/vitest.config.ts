import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.module.ts', '**/*.interface.ts', '**/*.dto.ts'],
    },
  },
});
