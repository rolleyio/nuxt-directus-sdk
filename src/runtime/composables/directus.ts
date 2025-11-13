import type { Ref } from '#imports'
import { useRequestHeaders, useRuntimeConfig, useState } from '#imports'
import { authentication, createDirectus, realtime, rest } from '@directus/sdk'
import { useUrl } from '../utils'
import { useDirectusStorage } from './storage'

export function useDirectusPreview(): Ref<boolean> {
  return useState('directus.preview', () => false)
}

export function useDirectusUrl(path = ''): string {
  const config = useRuntimeConfig()

  const devProxy = config.public.directus.devProxy
  const devProxyEnabled = typeof devProxy === 'object' ? devProxy.enabled !== false : devProxy !== false

  // When devProxy is enabled, use current origin + proxy path
  if (devProxyEnabled) {
    const proxyPath = typeof devProxy === 'object' && devProxy.path ? devProxy.path : '/directus'

    if (import.meta.client) {
      return useUrl(`${window.location.origin}${proxyPath}`, path)
    }
    else {
      // Server-side: get host from request headers if available
      const requestHeaders = useRequestHeaders(['host'])
      if (requestHeaders?.host) {
        const protocol = import.meta.dev ? 'http' : 'https'
        return useUrl(`${protocol}://${requestHeaders.host}${proxyPath}`, path)
      }
    }
  }

  // Fallback to configured URL
  return useUrl(config.public.directus.url, path)
}

function createDirectusClient() {
  const config = useRuntimeConfig()
  const authConfig = config.public.directus.auth

  // Capture headers during composable setup (in Nuxt context)
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : null

  // Create custom fetch that forwards cookies during SSR
  const customFetch: typeof fetch = async (url, options) => {
    // Convert URL to string for $fetch
    const urlString = typeof url === 'string' ? url : url.toString()

    // During SSR, forward cookies from the incoming request
    if (import.meta.server && requestHeaders?.cookie) {
      return globalThis.$fetch(urlString, {
        ...options as any,
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

  // Get WebSocket URL if devProxy is enabled
  const devProxy = config.public.directus.devProxy
  const devProxyWsUrl = devProxy && typeof devProxy === 'object' && devProxy.wsPath && import.meta.client
    ? `${window.location.origin}${devProxy.wsPath}`
    : undefined

  // In dev mode with proxy, use the separate WebSocket proxy path
  // Otherwise, let the SDK use the default (baseUrl + /websocket)
  const directus = createDirectus<DirectusSchema>(baseUrl, {
    globals: {
      fetch: customFetch,
    },
  })
    .with(authentication('session', {
      autoRefresh: authConfig.autoRefresh ?? true,
      credentials: (authConfig.credentials as any) || 'include',
      // Only use custom storage on server to prevent localStorage errors
      ...(import.meta.server ? { storage: useDirectusStorage() } : {}),
    }))
    .with(rest({
      credentials: (authConfig.credentials as any) || 'include',
    }))
    .with(realtime({
      authMode: (authConfig.realtimeAuthMode as any) || 'public',
      // Only set custom URL if we have a WebSocket proxy path
      ...(devProxyWsUrl ? { url: devProxyWsUrl } : {}),
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
