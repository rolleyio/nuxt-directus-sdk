import type { Ref } from '#imports'
import { useRuntimeConfig, useState } from '#imports'

import { authentication, createDirectus, realtime, rest } from '@directus/sdk'
import { useUrl } from '../utils'

export function useDirectusPreview(): Ref<boolean> {
  return useState('directus.preview', () => false)
}

export function useDirectusUrl(path = ''): string {
  return useUrl(useRuntimeConfig().public.directus.url, path)
}

export function useDirectus(token?: string) {
  const config = useRuntimeConfig()
  const authConfig = config.public.directus.auth as any

  const directus = createDirectus<DirectusSchema>(useDirectusUrl())
    .with(authentication('session', {
      autoRefresh: authConfig.autoRefresh ?? true,
      credentials: authConfig.credentials || 'include',
    }))
    .with(rest({
      credentials: authConfig.credentials || 'include',
    }))
    .with(realtime({
      authMode: authConfig.realtimeAuthMode || 'handshake',
    }))

  if (token)
    directus.setToken(token)

  return directus
}
