import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { authentication, createDirectus, rest } from '@directus/sdk'
import { getCookie } from 'h3'
import { useUrl } from '../../utils'

export function getDirectusSessionToken(event: H3Event): string | undefined {
  // Session mode: look for the session token cookie set by Directus
  return getCookie(event, 'directus_session_token')
}

export function useDirectusUrl(path = ''): string {
  const config = useRuntimeConfig()
  // eslint-disable-next-line typescript/no-explicit-any, typescript/no-unsafe-type-assertion -- runtime-injected config keys not in static types
  const serverUrl = (config as any).directus?.serverDirectusUrl as string | undefined
  const fallback =
    // eslint-disable-next-line typescript/no-explicit-any, typescript/no-unsafe-type-assertion -- runtime-injected config keys not in static types
    ((config.public.directus as any).directusUrl as string) || config.public.directus.url
  return useUrl(serverUrl || fallback, path)
}

export function useTokenDirectus(token?: string) {
  const directus = createDirectus<DirectusSchema>(useDirectusUrl())
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  if (token) void directus.setToken(token)

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
