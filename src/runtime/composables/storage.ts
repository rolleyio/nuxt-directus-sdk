import type { AuthenticationData, AuthenticationStorage } from '@directus/sdk'

/**
 * Custom storage implementation for Directus SDK on the server
 * Prevents localStorage errors during SSR
 */
export function useDirectusStorage(): AuthenticationStorage {
  let stored: AuthenticationData | null = null

  return {
    get: async () => stored,
    set: async (value: AuthenticationData | null) => {
      stored = value
    },
  }
}
