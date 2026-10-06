import type { Ref } from '#imports'
import type { WebSocketAuthModes } from '@directus/sdk'
import { useRequestHeaders, useRuntimeConfig, useState } from '#imports'
import { authentication, createDirectus, realtime, rest } from '@directus/sdk'
import { useUrl } from '../utils'
import { useDirectusStorage } from './storage'

export function useDirectusPreview(): Ref<boolean> {
  return useState('directus.preview', () => false)
}

/** Live-preview static token from `?token=`; shared so SSR + client clients apply it. */
export function useDirectusPreviewToken(): Ref<string | null> {
  return useState<string | null>('directus.previewToken', () => null)
}

export function useDirectusVisualEditor(): Ref<boolean> {
  return useState('directus.visualEditor', () => false)
}

function resolveClientUrl(): string {
  const config = useRuntimeConfig()
  return config.public.directus.directusUrl || config.public.directus.url
}

function resolveServerUrl(): string {
  const config = useRuntimeConfig()
  return config.directus?.serverDirectusUrl || resolveClientUrl()
}

// The module writes proxy as a full object; the generated runtime-config.d.ts
// collapses it to boolean. Cast to the actual shape so property access is safe.
type ProxyConfig = boolean | { enabled?: boolean, path?: string, wsPath?: string }

export function useDirectusUrl(path = ''): string {
  const config = useRuntimeConfig()

  const proxy = config.public.directus.proxy as ProxyConfig
  const proxyEnabled = typeof proxy === 'object' ? proxy.enabled === true : proxy === true

  // When the proxy is enabled, use current origin + proxy path
  if (proxyEnabled) {
    const proxyPath = typeof proxy === 'object' && proxy.path ? proxy.path : '/directus'

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

  // On server without proxy, prefer the server URL (for Docker/K8s internal networking)
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
      // Bridge between RequestInit (browser fetch API) and $fetch (Nuxt/ofetch);
      // the runtime shape is correct so we cast to satisfy the overload.
      return globalThis.$fetch(urlString, {
        ...options,
        headers: {
          ...options?.headers as Record<string, string>,
          cookie: requestHeaders.cookie,
        },
      } as never)
    }

    // On client, use regular fetch with credentials
    return globalThis.$fetch(urlString, { ...options, credentials: 'include' } as never)
  }

  const baseUrl = useDirectusUrl()

  // Resolve the realtime WebSocket URL.
  //
  // - Dev with WS proxy: use the proxy path on the current origin.
  // - HTTP proxy on but no WS proxy (production): point realtime directly at
  //   the real Directus URL; the HTTP proxy can't carry WebSocket upgrades.
  // - No proxy: omit, let the SDK default (baseUrl + /websocket).
  const proxy = config.public.directus.proxy as ProxyConfig
  const proxyEnabled = typeof proxy === 'object' ? proxy.enabled === true : proxy === true
  const proxyWsPath = typeof proxy === 'object' ? proxy.wsPath : undefined

  let realtimeUrl: string | undefined
  if (proxyWsPath && import.meta.client) {
    realtimeUrl = `${window.location.origin}${proxyWsPath}`
  }
  else if (proxyEnabled && import.meta.client) {
    // Production proxy mode: realtime bypasses the proxy and connects directly.
    const directUrl = resolveClientUrl()
    realtimeUrl = directUrl ? `${directUrl.replace(/^http/, 'ws').replace(/\/$/, '')}/websocket` : undefined
  }

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
      ...(realtimeUrl ? { url: realtimeUrl } : {}),
    }))

  // Apply shared preview token so SSR component fetches see live preview too
  // (plugin.setToken alone only hit the first server client instance).
  const previewToken = useDirectusPreviewToken().value
  if (previewToken)
    directus.setToken(previewToken)

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
