import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['tests/unit/**/*.test.{js,ts}'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
  },
});
