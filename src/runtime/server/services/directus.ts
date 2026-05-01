import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { authentication, createDirectus, rest } from '@directus/sdk'
import { getCookie } from 'h3'
import { useUrl } from '../../utils'

type DirectusServerClient<TSchema extends object>
  = DirectusClient<TSchema>
    & AuthenticationClient<TSchema>
    & RestClient<TSchema>

export function getDirectusSessionToken(event: H3Event): string | undefined {
  // Session mode: look for the session token cookie set by Directus
  return getCookie(event, 'directus_session_token')
}

export function useDirectusUrl(path = ''): string {
  const config = useRuntimeConfig()
  const serverUrl = config.directus?.serverDirectusUrl
  const fallback = config.public.directus.directusUrl || config.public.directus.url
  const url = serverUrl || fallback || process.env.DIRECTUS_URL || ''
  return useUrl(url, path)
}

export function useTokenDirectus<TSchema extends object = DirectusSchema>(token?: string): DirectusServerClient<TSchema> {
  const directus = createDirectus<TSchema>(useDirectusUrl())
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  if (token)
    directus.setToken(token)

  return directus
}

export function useSessionDirectus<TSchema extends object = DirectusSchema>(event: H3Event): DirectusServerClient<TSchema> {
  // Derive the client's auth from the session cookie on the incoming request.
  return useTokenDirectus<TSchema>(getDirectusSessionToken(event))
}

export function useAdminDirectus<TSchema extends object = DirectusSchema>(): DirectusServerClient<TSchema> {
  const config = useRuntimeConfig().directus
  const adminToken = config.adminToken || process.env.DIRECTUS_ADMIN_TOKEN

  if (!adminToken)
    throw new Error('DIRECTUS_ADMIN_TOKEN is not set in config options or .env file')

  return useTokenDirectus<TSchema>(adminToken)
}
