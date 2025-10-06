import type { Ref } from '#imports'

import { useRequestHeaders, useRuntimeConfig, useState } from '#imports'

import { authentication, createDirectus, realtime, rest } from '@directus/sdk'
import { useUrl } from '../utils'
import { useDirectusStorage } from './storage'

export function useDirectusPreview(): Ref<boolean> {
  return useState('directus.preview', () => false)
}

export function useDirectusUrl(path = ''): string {
  return useUrl(useRuntimeConfig().public.directus.url, path)
}

function createDirectusClient() {
  const config = useRuntimeConfig()
  const authConfig = config.public.directus.auth as any

  // Capture headers during composable setup (in Nuxt context)
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : null

  // Create custom fetch that forwards cookies during SSR
  const customFetch: typeof fetch = async (url, options) => {
    // During SSR, forward cookies from the incoming request
    if (import.meta.server && requestHeaders?.cookie) {
      return globalThis.$fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          cookie: requestHeaders.cookie,
        },
      })
    }

    // On client, use regular fetch with credentials
    return globalThis.$fetch(url, { ...options, credentials: 'include' })
  }

  const directus = createDirectus<DirectusSchema>(useDirectusUrl(), {
    globals: {
      fetch: customFetch,
    },
  })
    .with(authentication('session', {
      autoRefresh: authConfig.autoRefresh ?? true,
      credentials: authConfig.credentials || 'include',
      // Only use custom storage on server to prevent localStorage errors
      ...(import.meta.server ? { storage: useDirectusStorage() } : {}),
    }))
    .with(rest({
      credentials: authConfig.credentials || 'include',
    }))
    .with(realtime({
      authMode: authConfig.realtimeAuthMode || 'handshake',
      // Use actual Directus URL for WebSockets (Nitro devProxy doesn't support WS upgrades)
      // The SDK will use handshake mode to authenticate after connection
      url: config.public.directus.directusUrl
        ? useUrl(config.public.directus.directusUrl, 'websocket')
        : undefined,
    }))

  return directus
}

let directus: ReturnType<typeof createDirectusClient> | null = null

export function useDirectus() {
  if (!directus) {
    directus = createDirectusClient()
  }

  return directus
}
