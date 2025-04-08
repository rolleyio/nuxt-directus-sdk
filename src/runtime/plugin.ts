import { addRouteMiddleware, defineNuxtPlugin, refreshNuxtData, useRoute, useRuntimeConfig } from '#app'
import { apply, remove } from '@directus/visual-editing'
import { useDirectusAuth } from './composables/auth'
import { useDirectus } from './composables/directus'
import { isVisualEditorPage } from './composables/preview'
import auth from './middleware/auth'

export default defineNuxtPlugin(async (nuxtApp) => {
  const route = useRoute()
  const config = useRuntimeConfig()

  // ** Live Preview Bits **
  // Check if we are in preview mode
  const preview = route.query.preview && route.query.preview === 'true'
  const livePreview = isVisualEditorPage()
  const token = route.query.token as string | undefined

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
    if (config.public.directus.fetchUser)
      await useDirectusAuth().readMe()
  }

  await fetchUser()

  let loadedUser = false

  nuxtApp.hook('page:start', async () => {
    if (import.meta.client && !loadedUser) {
      await fetchUser()
      loadedUser = true
    }
  })

  addRouteMiddleware('auth', auth)
})
