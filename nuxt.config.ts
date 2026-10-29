import tailwindcss from '@tailwindcss/vite'

// PWA and Sentry break inside the Vitest environment (virtual modules, server build)
const isVitest = !!process.env.VITEST

export default defineNuxtConfig({
  compatibilityDate: '2026-10-28',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    'shadcn-nuxt',
    ...(isVitest ? [] : ['@vite-pwa/nuxt', '@sentry/nuxt/module']),
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
    },
  },

  // Components register by file name; ui/ is registered by shadcn-nuxt
  components: [{ path: '~/components', pathPrefix: false, ignore: ['ui/**'] }],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  // SPA panel (no SEO needed); SSR only for the landing and the public booking page
  routeRules: {
    '/': { prerender: true },
    '/r/**': { ssr: true },
    '/app/**': { ssr: false },
    '/admin/**': { ssr: false },
    '/login': { ssr: false },
    '/confirm': { ssr: false },
  },

  runtimeConfig: {
    public: {
      sentry: { dsn: '' },
      posthog: { key: '', host: 'https://us.i.posthog.com' },
    },
  },

  supabase: {
    types: '~/types/database.types.ts',
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: ['/app(/*)?', '/admin(/*)?'],
      exclude: [],
      saveRedirectToCookie: true,
    },
  },

  shadcn: {
    prefix: '',
    componentDir: '~/components/ui',
  },

  // Installable to the home screen; no offline mode (the app requires internet)
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Novium CarWash',
      short_name: 'CarWash',
      lang: 'es',
      display: 'standalone',
      start_url: '/app',
      theme_color: '#0f172a',
      background_color: '#ffffff',
      icons: [],
    },
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
    },
    devOptions: { enabled: false },
  },

  sentry: {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
  },

  sourcemap: { client: 'hidden' },
})
