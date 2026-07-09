import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { authentication, createDirectus, readMe, readPolicyGlobals, rest } from '@directus/sdk'
import { createError, getCookie } from 'h3'
import { useUrl } from '../../utils'
import { resolvePublicDirectusUrl } from '../../utils/directus-url'

export function getDirectusSessionToken(event: H3Event): string | undefined {
  // Session mode: look for the session token cookie set by Directus
  return getCookie(event, 'directus_session_token')
}

export function useDirectusUrl(path = ''): string {
  const config = useRuntimeConfig()
  const serverUrl = config.directus?.serverDirectusUrl
  const fallback = resolvePublicDirectusUrl(config.public.directus)
  const url = serverUrl || fallback || process.env.DIRECTUS_URL || ''
  return useUrl(url, path)
}

export function useTokenDirectus(token?: string) {
  const directus = createDirectus<DirectusSchema>(useDirectusUrl())
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  if (token)
    directus.setToken(token)

  return directus
}

export function useSessionDirectus(event: H3Event) {
  // Derive the client's auth from the session cookie on the incoming request.
  return useTokenDirectus(getDirectusSessionToken(event))
}

export function useAdminDirectus() {
  const config = useRuntimeConfig().directus
  const adminToken = config.adminToken || process.env.DIRECTUS_ADMIN_TOKEN

  if (!adminToken)
    throw new Error('DIRECTUS_ADMIN_TOKEN is not set in config options or .env file')

  return useTokenDirectus(adminToken)
}

function requireSessionDirectus(event: H3Event) {
  const token = getDirectusSessionToken(event)
  if (!token)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  return useTokenDirectus(token)
}

async function fetchCurrentDirectusUser(
  client: ReturnType<typeof useTokenDirectus>,
): Promise<DirectusUser> {
  let user: DirectusUser
  try {
    user = await client.request(readMe()) as DirectusUser
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (!user?.id)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  return user
}

/**
 * Resolve the current session user for an H3 event, or throw 401.
 * Uses the session cookie via {@link useSessionDirectus}.
 */
export async function requireDirectusUser(event: H3Event): Promise<DirectusUser> {
  return fetchCurrentDirectusUser(requireSessionDirectus(event))
}

/**
 * Require an authenticated session user with admin access.
 * Uses Directus' effective policy globals so direct, role, and inherited policies
 * are evaluated consistently by Directus itself.
 */
export async function requireDirectusAdmin(event: H3Event): Promise<DirectusUser> {
  const client = requireSessionDirectus(event)
  const user = await fetchCurrentDirectusUser(client)
  const globals = await client.request(readPolicyGlobals())

  if (!globals.admin_access)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  return user
}
