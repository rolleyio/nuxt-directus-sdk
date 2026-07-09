import {
  defineNuxtRouteMiddleware,
  navigateTo,
  useDirectusUser,
  useRuntimeConfig,
} from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  const user = useDirectusUser()

  const redirect = config.public.directus.auth?.redirect ?? {}
  const loginPath = redirect.login ?? '/auth/login'
  const homePath = redirect.home ?? '/'

  if (to.path === loginPath) {
    return
  }

  if (!user.value) {
    return navigateTo({
      path: loginPath,
      query: { redirect: to.fullPath !== homePath ? encodeURIComponent(to.fullPath) : undefined },
    })
  }
})
