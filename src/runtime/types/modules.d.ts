import type { DirectusUsers } from 'nuxt/app'

declare module "#app" {
  interface RuntimeNuxtHooks {
    "directus:loggedIn": (user: DirectusUsers | null) => void;
  }
}

