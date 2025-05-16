import {
  defineNuxtRouteMiddleware,
  navigateTo,
  useDirectusUser,
  useRuntimeConfig,
} from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  const user = useDirectusUser()

  const loginPath = config.public.directus.loginPath ?? '/login'

  if (to.path === loginPath) {
    return
  }

  if (!user.value) {
    return navigateTo({
      path: loginPath,
      query: { redirect: to.path !== '/' ? encodeURIComponent(to.path) : undefined },
    })
  }
})
