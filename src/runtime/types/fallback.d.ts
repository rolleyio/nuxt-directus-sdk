export interface FallbackSchema {
  directus_users?: Record<string, never>
}

// TODO: (eslint) empty interface used for global augmentation pattern
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare global { interface DirectusSchema extends FallbackSchema { } }
