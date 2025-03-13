import {
  defineNuxtRouteMiddleware,
  navigateTo,
  useDirectusUser,
  useRuntimeConfig,
} from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  const user = useDirectusUser()

  if (!user.value) {
    return navigateTo({
      path: config.public.directus.loginPath ?? '/login',
      query: { redirect: to.path !== '/' ? encodeURIComponent(to.path) : undefined },
    })
  }
})
