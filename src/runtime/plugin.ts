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

  // Cookies
  const sessionCookie = useCookie('directus_session_token')
  const directusUrlCookie = useCookie('directus_instance_url')
  const previewCookie = useCookie('directus_preview', { default: () => false })
  const previewTokenCookie = useCookie('directus_preview_token')

  // Check if we're connecting to a different Directus instance
  // If so, clear all cookies to prevent session/preview leakage between instances
  const currentDirectusUrl = (config.public.directus as any).directusUrl || config.public.directus.url

  if (directusUrlCookie.value && directusUrlCookie.value !== currentDirectusUrl) {
    // Different Directus instance detected - clear all Directus cookies
    sessionCookie.value = null
    previewCookie.value = false
    previewTokenCookie.value = null
  }

  // Update the Directus URL cookie to track which instance we're connected to
  directusUrlCookie.value = currentDirectusUrl

  // Live Preview/Visual Editor
  // Auto-detect if we're inside an iframe (Directus visual editor) or use query params/cookie
  const previewFromQuery = isQueryParamEnabled(route.query.preview) || isQueryParamEnabled(route.query['visual-editor'])
  const isInIframe = import.meta.client && window.parent !== window

  if (isInIframe || previewFromQuery) {
    // Auto-enable preview mode when inside an iframe (visual editor) or via query params
    previewCookie.value = true
    directusPreview.value = true
  }
  else if (previewCookie.value) {
    // Restore preview state from cookie after page reload
    directusPreview.value = true
  }

  if (directusPreview.value) {
    // If we are in preview mode, we need to use the token from the query string or cookie
    const token = (route.query.token as string | undefined) || previewTokenCookie.value || undefined

    if (route.query.token) {
      // Persist token in cookie for reloads
      previewTokenCookie.value = route.query.token as string
    }

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

  if (authEnabled && directusAuth.user.value === null && sessionCookie.value) {
    const user = await directusAuth.readMe()
    await nuxtApp.callHook('directus:loggedIn', user)
  }
  else {
    await nuxtApp.callHook('directus:loggedIn', null)
  }
})
