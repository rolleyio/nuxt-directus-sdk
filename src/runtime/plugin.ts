import { defineNuxtPlugin, refreshNuxtData, useRequestHeaders, useRoute, useRuntimeConfig } from '#app'
import { useDirectusAuth } from './composables/auth'
import { useDirectus, useDirectusPreview } from './composables/directus'

export default defineNuxtPlugin(async (nuxtApp) => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const directus = useDirectus()
  const directusAuth = useDirectusAuth()
  const directusPreview = useDirectusPreview()

  console.log('route', route.fullPath)

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

  let loadedUser = false

  async function fetchUser() {
    if (config.public.directus.auth?.enabled ?? true) {
      await directusAuth.readMe()
      console.log('haded?')

      loadedUser = true
    }
  }

  await fetchUser()

  nuxtApp.hook('page:start', async () => {
    console.log('loading??')
    if (import.meta.client && !loadedUser) {
      await fetchUser()
      loadedUser = true
    }
  })
})
