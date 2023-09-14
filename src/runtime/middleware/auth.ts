import {
  defineNuxtRouteMiddleware,
  navigateTo,
  useDirectusUser,
  useRuntimeConfig,
} from '#imports'

// TODO: could open this up and extend
// type MiddlewareMeta = boolean | {
//   unauthenticatedOnly: true
//   navigateAuthenticatedTo?: string
// }

type MiddlewareMeta = boolean

// https://github.com/sidebase/nuxt-auth/blob/main/src/runtime/middleware/auth.ts
declare module '#app/../pages/runtime/composables' {
  interface PageMeta {
    auth?: MiddlewareMeta
  }
}

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
