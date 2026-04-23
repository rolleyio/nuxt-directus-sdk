import type { Ref } from '#imports'
import type { WebSocketAuthModes } from '@directus/sdk'
import { useRequestHeaders, useRuntimeConfig, useState } from '#imports'
import { authentication, createDirectus, realtime, rest } from '@directus/sdk'
import { useUrl } from '../utils'
import { useDirectusStorage } from './storage'

export function useDirectusPreview(): Ref<boolean> {
  return useState('directus.preview', () => false)
}

export function useDirectusVisualEditor(): Ref<boolean> {
  return useState('directus.visualEditor', () => false)
}

function resolveClientUrl(): string {
  const config = useRuntimeConfig()
  // TODO: (eslint) revisit any types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (config.public.directus as any).directusUrl || config.public.directus.url
}

function resolveServerUrl(): string {
  const config = useRuntimeConfig()
  // TODO: (eslint) revisit any types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (config as any).directus?.serverDirectusUrl || resolveClientUrl()
}

export function useDirectusUrl(path = ''): string {
  const config = useRuntimeConfig()

  const devProxy = config.public.directus.devProxy
  const devProxyEnabled = typeof devProxy === 'object' ? devProxy.enabled === true : devProxy === true

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

  // On server without devProxy, prefer the server URL (for Docker/K8s internal networking)
  if (import.meta.server) {
    return useUrl(resolveServerUrl(), path)
  }

  // Fallback to client URL
  return useUrl(resolveClientUrl(), path)
}

export function useDirectusOriginUrl(path = ''): string {
  return useUrl(resolveClientUrl(), path)
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
        // TODO: (eslint) revisit any types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...options as any, // $fetch will normalize the method for us
        headers: {
          ...options?.headers,
          cookie: requestHeaders.cookie,
        },
      })
    }

    // On client, use regular fetch with credentials
    // TODO: (eslint) revisit any types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
