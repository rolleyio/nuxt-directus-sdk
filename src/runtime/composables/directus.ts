import type { AuthenticationClient, AuthenticationStorage, DirectusClient, RestClient, WebSocketClient } from '@directus/sdk'
import { authentication, createDirectus, realtime, rest } from '@directus/sdk'
import { joinURL, withTrailingSlash, cleanDoubleSlashes } from 'ufo'

import type { DirectusSchema } from 'nuxt/app'
import { useDirectusTokens } from './tokens'
import { useRuntimeConfig } from '#app'

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

// TODO: Might need to change this to allow for conditional type based on auth, rest etc.
export function useDirectus(token?: string): DirectusClient<DirectusSchema> & AuthenticationClient<DirectusSchema> & RestClient<DirectusSchema> & WebSocketClient<DirectusSchema> {
  const url = useDirectusUrl()

  const directus = createDirectus<DirectusSchema>(url)
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
