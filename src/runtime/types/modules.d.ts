export {}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'directus:loggedIn': (user: DirectusUser | null) => void
  }

  interface NuxtApp {
    $directusVisualEditing?: {
      refresh: () => Promise<void>
    }
  }
}
