import { defineNuxtPlugin, refreshNuxtData, useRequestHeaders, useRoute, useRuntimeConfig } from '#app'
import { useDirectusAuth } from './composables/auth'
import { useDirectus, useDirectusPreview } from './composables/directus'

export default defineNuxtPlugin(async (nuxtApp) => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const directus = useDirectus()
  const directusAuth = useDirectusAuth()
  const directusPreview = useDirectusPreview()

  // Live Preview/Visual Editor
  directusPreview.value = !!(route.query.preview === 'true' || route.query.preview === '1' || route.query['visual-editor'] === 'true' || route.query['visual-editor'] === '1')

  if (directusPreview.value) {
    // If we are in preview mode, we need to use the token from the query string
    const token = route.query.token as string | undefined

    if (token) {
      directus.setToken(token)

      nuxtApp.hook('page:finish', () => {
        refreshNuxtData()
      })
    }
  }

  // Fetch user session if auth is enabled
  // Only fetch once - user state is cached in useState, so subsequent calls won't refetch
  const authEnabled = config.public.directus.auth?.enabled ?? true

  if (authEnabled && directusAuth.user.value === null) {
    // Only fetch if we haven't already loaded the user
    // Check if session token exists before attempting to fetch user
    const hasSessionToken = import.meta.server
      ? useRequestHeaders(['cookie']).cookie?.includes('directus_session_token')
      : document.cookie.includes('directus_session_token')

    if (import.meta.server) {
      // eslint-disable-next-line no-console
      console.log('[Plugin] SSR - Has session token:', hasSessionToken)
      // eslint-disable-next-line no-console
      console.log('[Plugin] SSR - Cookie header:', useRequestHeaders(['cookie']).cookie)
    }

    if (hasSessionToken) {
      // eslint-disable-next-line no-console
      console.log('[Plugin] Calling readMe()', hasSessionToken)
      const test = await directusAuth.readMe()
      console.log('[Plugin] User:', test, directusAuth.user.value)
    }
  }
})
