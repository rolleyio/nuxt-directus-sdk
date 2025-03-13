import { addRouteMiddleware, defineNuxtPlugin, refreshNuxtData, useRoute, useRuntimeConfig } from '#app'
import { useDirectusAuth } from './composables/auth'
import { useDirectus } from './composables/directus'
import auth from './middleware/auth'

export default defineNuxtPlugin(async (nuxtApp) => {
  const route = useRoute()
  const config = useRuntimeConfig()

  // ** Live Preview Bits **
  // Check if we are in preview mode
  const preview = route.query.preview && route.query.preview === 'true'
  const token = route.query.token as string | undefined

  // If we are in preview mode, we need to use the token from the query string
  if (preview && token) {
    useDirectus().setToken(token)

    nuxtApp.hook('page:finish', () => {
      refreshNuxtData()
    })
  }

  async function fetchUser() {
    if (config.public.directus.fetchUser)
      await useDirectusAuth().readMe()
  }

  await fetchUser()

  nuxtApp.hook('page:start', async () => {
    if (import.meta.client)
      await fetchUser()
  })

  addRouteMiddleware('auth', auth)
})
