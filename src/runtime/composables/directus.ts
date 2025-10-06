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

  const directus = createDirectus<DirectusSchema>(useDirectusUrl(), {
    globals: {
      fetch: globalThis.$fetch.create({
        onRequest({ options }) {
          console.log('[Directus Fetch] ', options)
        },
        onResponse({ response, request }) {
          console.log('[Directus Fetch] ', response, request)
        },
        onRequestError({ request, options, error }) {
          console.error('[Directus Fetch] Request Error', { request, options, error })
        },
        onResponseError({ response, request, error }) {
          console.error('[Directus Fetch] Response Error', { response, request, error })
        },
      }),
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

// Client-side singleton (reused across navigations)
let clientSideDirectus: ReturnType<typeof createDirectusClient> | null = null

export function useDirectus() {
  // On server: create new instance per request (to capture correct request headers)
  // On client: reuse singleton (same user across navigations)
  if (import.meta.server) {
    return createDirectusClient()
  }

  if (!clientSideDirectus) {
    clientSideDirectus = createDirectusClient()
  }

  return clientSideDirectus
}
