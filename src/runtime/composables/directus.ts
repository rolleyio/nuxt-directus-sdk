import type { Ref } from '#imports'
import { useRequestHeaders, useRuntimeConfig, useState } from '#imports'
import { authentication, createDirectus, realtime, rest, type WebSocketAuthModes } from '@directus/sdk'
import { useUrl } from '../utils'
import { useDirectusStorage } from './storage'
import type { DirectusSchema } from '#build/types/directus'

export function useDirectusPreview(): Ref<boolean> {
  return useState('directus.preview', () => false)
}

export function useDirectusUrl(path = ''): string {
  return useUrl(useRuntimeConfig().public.directus.url, path)
}

function createDirectusClient() {
  const config = useRuntimeConfig()
  const authConfig = config.public.directus.auth

  // Capture headers during composable setup (in Nuxt context)
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : null

  // Create custom fetch that forwards cookies during SSR
  const customFetch: typeof fetch = async (url, options) => {
    // normalize url into string for $fetch
    const urlString = url instanceof URL ? url.href : url
    // During SSR, forward cookies from the incoming request
    if (import.meta.server && requestHeaders?.cookie) {
      return globalThis.$fetch(urlString, {
        ...options as any, // $fetch will normalize the method for us
        headers: {
          ...options?.headers,
          cookie: requestHeaders.cookie,
        },
      })
    }

    // On client, use regular fetch with credentials
    return globalThis.$fetch(urlString, { ...options as any, credentials: 'include' })
  }

  const baseUrl = useDirectusUrl()

  // In dev mode with proxy, use the separate WebSocket proxy path
  // Otherwise, let the SDK use the default (baseUrl + /websocket)
  const directus = createDirectus<DirectusSchema>(baseUrl, {
    globals: {
      fetch: customFetch,
    },
  })
    .with(authentication('session', {
      autoRefresh: authConfig.autoRefresh ?? true,
      credentials: authConfig.credentials as RequestCredentials || 'include',
      // Only use custom storage on server to prevent localStorage errors
      ...(import.meta.server ? { storage: useDirectusStorage() } : {}),
    }))
    .with(rest({
      credentials: authConfig.credentials as RequestCredentials || 'include',
    }))
    .with(realtime({
      authMode: authConfig.realtimeAuthMode as WebSocketAuthModes || 'public',
      // Only set custom URL if we have a proxy path (dev mode with proxy enabled)
      ...(config.public.directus.wsProxyUrl ? { url: config.public.directus.wsProxyUrl } : {}),
    }))

  return directus
}

let directus: ReturnType<typeof createDirectusClient> | null = null

export function useDirectus() {
  // On server, always create a fresh client to capture current request headers
  // On client, use singleton to maintain state
  if (import.meta.server) {
    return createDirectusClient()
  }

  if (!directus) {
    directus = createDirectusClient()
  }

  return directus
}
