import { defineNuxtRouteMiddleware, navigateTo, useDirectusUser, useRuntimeConfig } from '#imports'

/**
 * Mark a page as public when global auth middleware is enabled.
 * Auth middleware short-circuits when route meta includes this name.
 *
 * When a logged-in user hits a pure guest page (e.g. login), redirect home
 * if they are already authenticated — but only when this middleware is used
 * alone on the login route. Visitor-only pages that simply need to stay
 * public should use `middleware: 'guest'` and leave users as-is.
 */
export default defineNuxtRouteMiddleware((to) => {
  const user = useDirectusUser()
  const config = useRuntimeConfig()
  const loginPath = config.public.directus.auth?.redirect?.login ?? '/auth/login'
  const homePath = config.public.directus.auth?.redirect?.home ?? '/'

  // Allow access without authentication (global auth checks this name).
  // Optionally bounce authenticated users away from the login page itself.
  if (user.value && to.path === loginPath) {
    return navigateTo(homePath)
  }
})
