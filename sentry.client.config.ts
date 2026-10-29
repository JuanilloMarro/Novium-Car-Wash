import * as Sentry from '@sentry/nuxt'

const dsn = useRuntimeConfig().public.sentry.dsn

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  })
}
