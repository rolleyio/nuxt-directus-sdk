import type { DirectusUsers } from 'nuxt/app'

// TEST does this work to get the user?
declare module "#app" {
  interface RuntimeNuxtHooks {
    "directus:loggedIn": (user: DirectusUsers | null) => void;
  }
}

