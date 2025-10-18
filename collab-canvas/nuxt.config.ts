// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui',
    'nuxt-mcp',
    '@nuxthub/core',
    'nuxt-emoji-picker'
  ],

  css: ['~/assets/css/main.css'],

  // NuxtHub configuration
  hub: {
    ai: true
  },

  experimental: {
    componentIslands: {
      selectiveClient: true
    }
  },

  // Performance optimizations
  nitro: {
    compressPublicAssets: true,
    minify: true,
    experimental: {
      openAPI: true
    }
  },

  // Route rules for better performance
  routeRules: {
    // Canvas page should be client-side only for better interactivity
    '/canvas': { ssr: false },
    // Static pages can be pre-rendered
    '/': { prerender: true },
    '/login': { prerender: true },
    '/signup': { prerender: true }
  },

  typescript: {
    typeCheck: true,
    tsConfig: {
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/tests/**',
        '**/test/**'
      ]
    }
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || 'development'
    }
  },

  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
      meta: [
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'format-detection', content: 'telephone=no' }
      ]
    }
  }
});