export interface FallbackSchema {
  directus_users?: Record<string, never>
}

declare global { interface DirectusSchema extends FallbackSchema { } }
