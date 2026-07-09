import {
  defineNuxtRouteMiddleware,
  navigateTo,
  useDirectusUser,
  useRuntimeConfig,
} from '#imports'

function hasGuestMeta(to: { meta?: Record<string, unknown> }): boolean {
  const middleware = to.meta?.middleware
  if (!middleware)
    return false
  if (middleware === 'guest')
    return true
  return Array.isArray(middleware) && middleware.includes('guest')
}

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  const user = useDirectusUser()

  const redirect = config.public.directus.auth?.redirect ?? {}
  const loginPath = redirect.login ?? '/auth/login'
  const homePath = redirect.home ?? '/'

  if (to.path === loginPath) {
    return
  }

  // Named `guest` middleware marks public pages when global auth is enabled.
  if (hasGuestMeta(to)) {
    return
  }

  if (!user.value) {
    return navigateTo({
      path: loginPath,
      query: { redirect: to.path !== homePath ? encodeURIComponent(to.fullPath) : undefined },
    })
  }
})
