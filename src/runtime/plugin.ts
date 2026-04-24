import { defineNuxtPlugin, refreshNuxtData, useCookie, useRoute, useRuntimeConfig } from '#app'
import { useDirectusAuth } from './composables/auth'
import { useDirectus, useDirectusOriginUrl, useDirectusPreview, useDirectusVisualEditor } from './composables/directus'
import { isQueryParamEnabled } from './utils'

export default defineNuxtPlugin({
  name: 'directus-plugin',
  async setup(nuxtApp) {
    const route = useRoute()
    const config = useRuntimeConfig()
    const directus = useDirectus()
    const directusAuth = useDirectusAuth()
    const directusPreview = useDirectusPreview()
    const directusVisualEditor = useDirectusVisualEditor()

    const debug = import.meta.client && route.query.debug !== undefined
    const log = (...args: unknown[]) => {
      if (debug)
        console.warn('[Directus Plugin]', ...args)
    }

    // Live Preview
    directusPreview.value = isQueryParamEnabled(route.query.preview)
    log('Preview mode:', directusPreview.value)

    // Visual Editor — detect if we're inside an iframe (client-side only)
    if (import.meta.client && config.public.directus.visualEditor) {
      directusVisualEditor.value = window.parent !== window
      log('Visual editor config enabled:', true)
      log('Is in iframe:', directusVisualEditor.value)
    }

    if (directusPreview.value) {
      // If we are in preview mode, we need to use the token from the query string
      const token = route.query.token as string | undefined

      if (token) {
        directus.setToken(token)
        log('Preview token set')

        nuxtApp.hook('page:finish', () => {
          refreshNuxtData()
        })
      }
    }

    // Fetch user session if auth is enabled
    // Only fetch once - user state is cached in useState, so subsequent calls won't refetch
    const authEnabled = config.public.directus.auth?.enabled ?? true

    if (authEnabled) {
      const sessionCookie = useCookie('directus_session_token')
      const directusUrlCookie = useCookie('directus_instance_url')

      // Only track the Directus instance URL when there's an active session
      // This avoids setting a cookie on anonymous requests, allowing CDN caching
      if (sessionCookie.value) {
        const currentDirectusUrl = useDirectusOriginUrl()
        if (directusUrlCookie.value !== currentDirectusUrl) {
          if (directusUrlCookie.value) {
            sessionCookie.value = null
          }
          directusUrlCookie.value = currentDirectusUrl
        }
      }

      if (directusAuth.user.value === null && sessionCookie.value) {
        const user = await directusAuth.readMe()
        await nuxtApp.callHook('directus:loggedIn', user)
      }
      else {
        await nuxtApp.callHook('directus:loggedIn', null)
      }
    }
  },
})
