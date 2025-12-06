import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['**/__tests__/*.spec.(ts|tsx|js)'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'lib',
        'coverage',
        '**/*.d.ts',
        '**/*.spec.{ts,tsx,js}',
        '**/scripts/**',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
