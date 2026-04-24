import type { DirectusStorage } from '@directus/sdk' // FIXME: AuthenticationStorage?

/**
 * Custom storage implementation for Directus SDK on the server
 * Prevents localStorage errors during SSR
 */
export function useDirectusStorage(): DirectusStorage {
  const storage = new Map<string, unknown>()

  return {
    get: async (key: string) => {
      return storage.get(key) ?? null
    },
    set: async (key: string, value: unknown) => {
      storage.set(key, value)
    },
  }
}
