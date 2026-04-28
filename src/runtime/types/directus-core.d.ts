// TODO: This can probably be combined with fallback.d.ts. Need to check what happens when types is disabled completely.
// check with FALLBACK_TYPE_STRING as well.
// https://github.com/rolleyio/nuxt-directus-sdk/issues/77
export {}

declare global {
  // Minimal Directus core entity types - always at least this shape.
  interface DirectusUser {
    id: string
  }

  interface DirectusFile {
    id: string
  }
}
