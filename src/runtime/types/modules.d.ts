declare module '#app' {
  interface RuntimeNuxtHooks {
    // eslint-disable-next-line typescript/no-redundant-type-constituents
    'directus:loggedIn': (user: import('@directus/sdk').DirectusUser<DirectusSchema> | null) => void
  }

  interface NuxtApp {
    $directusVisualEditing?: {
      refresh: () => Promise<void>
    }
  }
}
