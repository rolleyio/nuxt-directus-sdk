import { defineNuxtRouteMiddleware, navigateTo, useDirectusUser, useRuntimeConfig } from '#imports'

/**
 * Mark a page as public when global auth middleware is enabled.
 * Auth middleware short-circuits when route meta includes this name.
 *
 * Logged-in users are redirected home from the configured login path.
 * Every other guest page stays reachable for logged-in users too.
 */
export default defineNuxtRouteMiddleware((to) => {
  const user = useDirectusUser()
  const config = useRuntimeConfig()
  const loginPath = config.public.directus.auth?.redirect?.login ?? '/auth/login'
  const homePath = config.public.directus.auth?.redirect?.home ?? '/'

  if (user.value && to.path === loginPath) {
    return navigateTo(homePath)
  }
})
