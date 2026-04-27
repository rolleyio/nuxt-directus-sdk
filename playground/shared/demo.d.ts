export {}

/**
 * Minimal demo schema stubs for the playground.
 *
 * These let the playground typecheck without a live Directus instance.
 * The prefix "Rolley" matches playground/nuxt.config.ts `types.prefix`.
 * When Directus is connected, generated types override and extend these stubs
 * via TypeScript interface merging — they do not conflict.
 *
 * Consumers of the module do NOT need this file; it is playground-only.
 */
declare global {
  interface DirectusUser {
    first_name?: string | null
    last_name?: string | null
    email?: string | null
  }

  interface RolleyPost {
    id: string
    title?: string | null
    slug?: string | null
    status?: string | null
    published_at?: string | null
    content?: string | null
    image?: string | DirectusFile | null
    author?: string | DirectusUser | null
  }

  interface RolleyPage {
    id: string
    title?: string | null
    slug?: string | null
    status?: string | null
  }

  interface RolleyGlobals {
    id: string
  }

  interface DirectusSchema {
    posts: RolleyPost[]
    pages: RolleyPage[]
    globals: RolleyGlobals
    // Required so DirectusVisualEditor accepts collection="directus_users" in visual-editor.vue
    directus_users: DirectusUser
  }
}
