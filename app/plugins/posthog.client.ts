import posthog from 'posthog-js'

export default defineNuxtPlugin(() => {
  const { key, host } = useRuntimeConfig().public.posthog
  if (!key) return

  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_pageview: 'history_change',
  })

  return { provide: { posthog } }
})
