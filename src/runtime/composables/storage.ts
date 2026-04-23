import type { DirectusStorage } from '@directus/sdk' // FIXME: AuthenticationStorage?

/**
 * Custom storage implementation for Directus SDK on the server
 * Prevents localStorage errors during SSR
 */
export function useDirectusStorage(): DirectusStorage {
  // TODO: (eslint) revisit any types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = new Map<string, any>()

  return {
    get: async (key: string) => {
      return storage.get(key) ?? null
    },
    // TODO: (eslint) revisit any types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set: async (key: string, value: any) => {
      storage.set(key, value)
    },
  }
}
