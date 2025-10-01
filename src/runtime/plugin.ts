import { defineNuxtPlugin, refreshNuxtData, useRoute, useRuntimeConfig } from '#app'
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

  // Fetch user session once on app initialization
  // Session is persistent via httpOnly cookie, so we only need to check once
  async function fetchUser() {
    if (config.public.directus.auth?.enabled ?? true) {
      await directusAuth.readMe()
    }
  }

  // Fetch user on initial load (SSR or CSR)
  await fetchUser()
})
