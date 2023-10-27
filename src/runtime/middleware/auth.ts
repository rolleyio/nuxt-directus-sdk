import {
  defineNuxtRouteMiddleware,
  navigateTo,
  useDirectusUser,
  useRuntimeConfig,
} from '#imports'

// FIXME: this isn't correctly generating the auth middleware type (showing as invalid middleware)
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
