import auth from './middleware/auth'
import { useDirectusAuth } from './composables/auth'
import { addRouteMiddleware, defineNuxtPlugin, useRuntimeConfig } from '#app'

export default defineNuxtPlugin(async (nuxt) => {
  const config = useRuntimeConfig()

  if (config.public.directus.fetchUser)
    await useDirectusAuth().fetchUser()

  addRouteMiddleware('auth', auth)
})
