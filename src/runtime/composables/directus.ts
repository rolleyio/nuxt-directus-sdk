import type { AuthenticationClient, AuthenticationStorage, DirectusClient, RestClient, WebSocketClient } from '@directus/sdk'
import { authentication, createDirectus, realtime, rest } from '@directus/sdk'
import { useDirectusTokens } from './tokens'
import { useRuntimeConfig } from '#app'

import type { DirectusCollections } from '#build/types/directus'

export function useDirectusUrl(): string {
  return useRuntimeConfig().public.rolley.url
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

export function useDirectus(token?: string): DirectusClient<DirectusCollections> & AuthenticationClient<DirectusCollections> & RestClient<DirectusCollections> & WebSocketClient<DirectusCollections> {
  const url = useDirectusUrl()

  const directus = createDirectus<DirectusCollections>(url)
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
