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
  ],

  css: ['~/assets/css/main.css'],

  experimental: {
    componentIslands: {
      selectiveClient: true
    }
  },

  typescript: {
    typeCheck: true
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      // Support both new and legacy API keys
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY, // Legacy support
      supabaseSecretKey: process.env.SUPABASE_SECRET_KEY
    }
  }
});
