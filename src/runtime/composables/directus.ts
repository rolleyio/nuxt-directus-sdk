import type { AuthenticationClient, AuthenticationStorage, DirectusClient, RestClient, RestCommand, WebSocketClient } from '@directus/sdk'
import { authentication, createDirectus, realtime, rest } from '@directus/sdk'
import { joinURL, withTrailingSlash, cleanDoubleSlashes } from 'ufo'

import type { DirectusSchema } from 'nuxt/app'
import { useDirectusTokens } from './tokens'
import { useRuntimeConfig } from '#app'

// TEST
export function useDirectusUrl(path?: string): string {
  return cleanDoubleSlashes(withTrailingSlash(joinURL(useRuntimeConfig().public.directus.url, '/', path ?? '')))
}

function createDirectusStorage(): AuthenticationStorage {
  const tokens = useDirectusTokens()

  return {
    get() {
      return {
        access_token: tokens.accessToken.value,
        refresh_token: tokens.refreshToken.value,
        expires: tokens.expires.value,
        expires_at: tokens.expiresAt.value,
      }
    },
    set(value) {
      tokens.accessToken.value = value?.access_token ?? null
      tokens.refreshToken.value = value?.refresh_token ?? null
      tokens.expires.value = value?.expires ?? null
      tokens.expiresAt.value = value?.expires_at ?? null
    },
  } satisfies AuthenticationStorage
}

// TEST generic type overwrites custom?
// TODO: Might need to change this to allow for conditional type based on auth, rest etc.
export function useDirectus<T extends object = DirectusSchema>(token?: string): DirectusClient<T> & AuthenticationClient<T> & RestClient<T> & WebSocketClient<T> {
  const url = useDirectusUrl()

  const directus = createDirectus<T>(url)
    .with(authentication('json', {
      storage: createDirectusStorage(),
      autoRefresh: token !== '',
    }))
    .with(rest())
    .with(realtime())

  if (token)
    directus.setToken(token)

  return directus
}
