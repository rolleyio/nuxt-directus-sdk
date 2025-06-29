import { defineNuxtPlugin, refreshNuxtData, useCookie, useRoute, useRuntimeConfig } from '#app'
import { apply, remove } from '@directus/visual-editing'
import { useDirectusAuth } from './composables/auth'
import { useDirectus, useDirectusPreview } from './composables/directus'
import { useDirectusTokens } from './composables/tokens'

export default defineNuxtPlugin(async (nuxtApp) => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const tokens = useDirectusTokens()
  const directus = useDirectus()
  const directusAuth = useDirectusAuth()
  const directusPreview = useDirectusPreview()

  // Live Preview/Visual Editor
  directusPreview.value = !!(route.query.preview === 'true' || route.query.preview === '1') || !!(route.query['visual-editor'] === 'true' || route.query['visual-editor'] === '1')

  if (directusPreview.value) {
    if (config.public.directus.visualEditor) {
      nuxtApp.hook('page:start', async () => {
        if (import.meta.client) {
          remove()
        }
      })

      nuxtApp.hook('page:finish', () => {
        if (import.meta.client) {
          apply({ directusUrl: config.public.directus.url })
        }
      })
    }

    // If we are in preview mode, we need to use the token from the query string
    const token = route.query.token as string | undefined

    if (token) {
      directus.setToken(token)

      nuxtApp.hook('page:finish', () => {
        refreshNuxtData()
      })
    }
  }

  // Setup the API path token
  if (!tokens.directusUrl.value || tokens.directusUrl.value !== config.public.directus.url) {
    tokens.directusUrl.value = config.public.directus.url

    // If the URL changed and previously logged in, then we need to logout
    if (tokens.accessToken.value || tokens.refreshToken.value) {
      await nuxtApp.runWithContext(async () => {
        useCookie(config.public.directus.auth.cookies.accessToken).value = null
        useCookie(config.public.directus.auth.cookies.refreshToken).value = null
      })
    }
  }

  async function fetchUser() {
    if (config.public.directus.auth?.enabled ?? true)
      await directusAuth.readMe()
  }

  await fetchUser()

  let loadedUser = false

  nuxtApp.hook('page:start', async () => {
    if (import.meta.client && !loadedUser) {
      await fetchUser()
      loadedUser = true
    }
  })
})
