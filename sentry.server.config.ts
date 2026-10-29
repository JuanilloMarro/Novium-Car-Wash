import * as Sentry from '@sentry/nuxt'

if (process.env.NUXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  })
}
