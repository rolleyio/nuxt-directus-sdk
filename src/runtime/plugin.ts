import { defineNuxtPlugin, refreshNuxtData, useCookie, useRoute, useRuntimeConfig } from '#app'
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
  const sessionCookie = useCookie('directus_session_token')

  if (authEnabled && directusAuth.user.value === null && sessionCookie.value) {
    const user = await directusAuth.readMe()
    await nuxtApp.callHook('directus:loggedIn', user)
  }
  else {
    await nuxtApp.callHook('directus:loggedIn', null)
  }
})
