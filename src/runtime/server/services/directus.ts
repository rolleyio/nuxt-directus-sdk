import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { authentication, createDirectus, rest } from '@directus/sdk'

import { getCookie } from 'h3'
import { useUrl } from '../../utils'

export function useDirectusAccessToken(event: H3Event): string | undefined {
  return getCookie(event, useRuntimeConfig().public.directus.auth?.cookies?.accessToken ?? 'directus_access_token')
}

export function useDirectusUrl(path = ''): string {
  return useUrl(useRuntimeConfig().public.directus.url, path)
}

export function useDirectus(token?: string) {
  const directus = createDirectus<DirectusSchema>(useDirectusUrl())
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  if (token)
    directus.setToken(token)

  return directus
}

export function useUserDirectus(event: H3Event) {
  return useDirectus(useDirectusAccessToken(event))
}

export function useAdminDirectus() {
  const config = useRuntimeConfig().directus

  if (!config.adminToken)
    throw new Error('DIRECTUS_ADMIN_TOKEN is not set in config options or .env file')

  return useDirectus(config.adminToken)
}
