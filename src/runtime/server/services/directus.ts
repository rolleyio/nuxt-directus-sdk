import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk'
import { authentication, createDirectus, rest } from '@directus/sdk'
import type { H3Event } from 'h3'
import { getCookie } from 'h3'

import { useUrl } from '../../utils'
import { useRuntimeConfig } from '#imports'

export function useDirectusAccessToken(event: H3Event): string | undefined {
  return getCookie(event, useRuntimeConfig().public.directus.cookieNameAccessToken)
}

export function useDirectusUrl(path = ''): string {
  return useUrl(useRuntimeConfig().public.directus.url, path)
}

export function useDirectus<T extends object = DirectusSchema>(token?: string): DirectusClient<T> & AuthenticationClient<T> & RestClient<T> {
  const directus = createDirectus<T>(useDirectusUrl())
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  if (token)
    directus.setToken(token)

  return directus
}

export function useAdminDirectus<T extends object = DirectusSchema>() {
  const config = useRuntimeConfig().directus

  if (!config.adminToken)
    throw new Error('DIRECTUS_ADMIN_TOKEN is not set in config options or .env file')

  return useDirectus<T>(config.adminToken)
}
