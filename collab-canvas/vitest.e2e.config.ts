import { defineConfig } from 'vitest/config'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    name: 'e2e',
    root: './tests/e2e',
    environment: 'nuxt',
    setupFiles: ['../test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    environmentOptions: {
      nuxt: {
        rootDir: './',
        domEnvironment: 'happy-dom', // 'happy-dom' (default) or 'jsdom'
      }
    }
  },
})
