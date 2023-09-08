import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk'
import { authentication, createDirectus, rest } from '@directus/sdk'
import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { useRuntimeConfig } from '#imports'

import type { DirectusCollections } from '#build/types/directus'

export function useDirectusAccessToken(event: H3Event): string | undefined {
  return getCookie(event, 'directus_access_token')
}

export function useDirectusUrl(): string {
  return useRuntimeConfig().public.rolley.url
}

export function useDirectus(token?: string): DirectusClient<DirectusCollections> & AuthenticationClient<DirectusCollections> & RestClient<DirectusCollections> {
  const url = useDirectusUrl()

  if (!url)
    throw new Error('DIRECTUS_URL is not set in config options or .env file')

  const directus = createDirectus<DirectusCollections>(url).with(authentication('json', { autoRefresh: false })).with(rest())

  if (token)
    directus.setToken(token)

  return directus
}

export function useAdminDirectus(): DirectusClient<DirectusCollections> & AuthenticationClient<DirectusCollections> & RestClient<DirectusCollections> {
  const url = useDirectusUrl()

  if (!url)
    throw new Error('DIRECTUS_URL is not set in config options or .env file')

  if (!process.env.DIRECTUS_ADMIN_TOKEN)
    throw new Error('DIRECTUS_ADMIN_TOKEN is not set in config options or .env file')

  const directus = createDirectus<DirectusCollections>(url).with(authentication('json', { autoRefresh: false })).with(rest())

  directus.setToken(process.env.DIRECTUS_ADMIN_TOKEN)

  return directus
}
