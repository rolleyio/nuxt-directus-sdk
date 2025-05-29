import { defineNuxtPlugin, refreshNuxtData, useRoute, useRuntimeConfig } from '#app'
import { apply, remove } from '@directus/visual-editing'
import { useDirectusAuth } from './composables/auth'
import { useDirectus } from './composables/directus'
import { isVisualEditorPage } from './composables/preview'
import { useDirectusTokens } from './composables/tokens'

export default defineNuxtPlugin(async (nuxtApp) => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const tokens = useDirectusTokens()
  const directusAuth = useDirectusAuth()

  // ** Live Preview Bits **
  // Check if we are in preview mode
  const preview = route.query.preview && route.query.preview === 'true'
  const token = route.query.token as string | undefined
  const livePreview = isVisualEditorPage(route)

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

  // If we are in preview mode, we need to use the token from the query string
  if (preview && token) {
    useDirectus().setToken(token)

    nuxtApp.hook('page:finish', () => {
      refreshNuxtData()
    })
  }

  if (livePreview) {
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
