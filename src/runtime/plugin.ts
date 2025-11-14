import { defineNuxtPlugin, refreshNuxtData, useCookie, useRoute, useRuntimeConfig } from '#app'
import { useDirectusAuth } from './composables/auth'
import { useDirectus, useDirectusPreview } from './composables/directus'
import { isQueryParamEnabled } from './utils'

export default defineNuxtPlugin(async (nuxtApp) => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const directus = useDirectus()
  const directusAuth = useDirectusAuth()
  const directusPreview = useDirectusPreview()

  // Live Preview/Visual Editor
  directusPreview.value = isQueryParamEnabled(route.query.preview) || isQueryParamEnabled(route.query['visual-editor'])

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

  const sessionCookie = useCookie('directus_session_token')
  const directusUrlCookie = useCookie('directus_instance_url')

  // Check if we're connecting to a different Directus instance
  // If so, clear the session cookie to prevent session leakage between instances
  const currentDirectusUrl = (config.public.directus as any).directusUrl || config.public.directus.url

  if (directusUrlCookie.value && directusUrlCookie.value !== currentDirectusUrl) {
    // Different Directus instance detected - clear the session
    sessionCookie.value = null
  }

  // Update the Directus URL cookie to track which instance we're connected to
  directusUrlCookie.value = currentDirectusUrl

  // Fetch user session if auth is enabled
  // Only fetch once - user state is cached in useState, so subsequent calls won't refetch
  const authEnabled = config.public.directus.auth?.enabled ?? true

  if (authEnabled && directusAuth.user.value === null && sessionCookie.value) {
    const user = await directusAuth.readMe()
    await nuxtApp.callHook('directus:loggedIn', user)
  }
  else {
    await nuxtApp.callHook('directus:loggedIn', null)
  }
})
