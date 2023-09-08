import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk'
import { authentication, createDirectus, rest } from '@directus/sdk'
import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { useRuntimeConfig } from '#imports'

import type { AllCollections } from '#build/types/directus'

export function useDirectusAccessToken(event: H3Event): string | undefined {
  return getCookie(event, useRuntimeConfig().public.directus.cookieNameAccessToken)
}

export function useDirectusUrl(): string {
  return useRuntimeConfig().public.directus.url
}

export function useDirectus(token?: string): DirectusClient<AllCollections> & AuthenticationClient<AllCollections> & RestClient<AllCollections> {
  const url = useDirectusUrl()

  if (!url)
    throw new Error('DIRECTUS_URL is not set in config options or .env file')

  const directus = createDirectus<AllCollections>(url).with(authentication('json', { autoRefresh: false })).with(rest())

  if (token)
    directus.setToken(token)

  return directus
}

export function useAdminDirectus(): DirectusClient<AllCollections> & AuthenticationClient<AllCollections> & RestClient<AllCollections> {
  const config = useRuntimeConfig().directus

  if (!config.adminToken)
    throw new Error('DIRECTUS_ADMIN_TOKEN is not set in config options or .env file')

  return useDirectus(config.adminToken)
}
