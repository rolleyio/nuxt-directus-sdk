import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { authentication, createDirectus, rest } from '@directus/sdk'
import { getCookie } from 'h3'
import { useUrl } from '../../utils'

export function getDirectusSessionToken(event: H3Event): string | undefined {
  // Session mode: look for the session token cookie set by Directus

  const cookieHeader = event.headers.get('cookie')
  const token = getCookie(event, 'directus_session_token')

  // eslint-disable-next-line no-console
  console.log(`[Server ${event.path}] Token:`, token ? 'FOUND' : 'NOT FOUND', '| Has cookies:', !!cookieHeader)

  return token
}

export function useDirectusUrl(path = ''): string {
  return useUrl(useRuntimeConfig().public.directus.url, path)
}

export function useTokenDirectus(token?: string) {
  const directus = createDirectus<DirectusSchema>(useDirectusUrl())
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  if (token)
    directus.setToken(token)

  return directus
}

export function useServerDirectus(event: H3Event) {
  // Get cookie header from the incoming request
  return useTokenDirectus(getDirectusSessionToken(event))
}

export function useAdminDirectus() {
  const config = useRuntimeConfig().directus

  if (!config.adminToken)
    throw new Error('DIRECTUS_ADMIN_TOKEN is not set in config options or .env file')

  return useTokenDirectus(config.adminToken)
}
