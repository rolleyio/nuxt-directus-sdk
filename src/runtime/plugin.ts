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

  // Setup the API path token
  await nuxtApp.runWithContext(async () => {
    const directusUrl = useCookie('directus_url')

    if (!directusUrl.value || directusUrl.value !== config.public.directus.url) {
      directusUrl.value = config.public.directus.url

      const accessToken = useCookie(config.public.directus.auth.cookies.accessToken)
      const refreshToken = useCookie(config.public.directus.auth.cookies.refreshToken)

      // If the URL changed and previously logged in, then we need to logout
      if (accessToken.value || refreshToken.value) {
        accessToken.value = null
        refreshToken.value = null
      }
    }
  })

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
