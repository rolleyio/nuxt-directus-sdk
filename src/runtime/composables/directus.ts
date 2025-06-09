import type { Ref } from '#imports'
import type { AuthenticationStorage } from '@directus/sdk'
import { useRuntimeConfig, useState } from '#imports'

import { authentication, createDirectus, realtime, rest } from '@directus/sdk'
import { useUrl } from '../utils'
import { useDirectusTokens } from './tokens'

export function useDirectusPreview(): Ref<boolean> {
  return useState('directus.preview', () => false)
}

export function useDirectusUrl(path = ''): string {
  return useUrl(useRuntimeConfig().public.directus.url, path)
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

export function useDirectus(token?: string) {
  const directus = createDirectus<DirectusSchema>(useDirectusUrl())
    .with(authentication('json', {
      storage: createDirectusStorage(),
      autoRefresh: token === '',
    }))
    .with(rest())
    .with(realtime())

  if (token)
    directus.setToken(token)

  return directus
}
