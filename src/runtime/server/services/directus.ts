import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk'
import { authentication, createDirectus, rest } from '@directus/sdk'
import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import type { DirectusSchema } from 'nuxt/app'
import { useRuntimeConfig } from '#imports'

export function useDirectusAccessToken(event: H3Event): string | undefined {
  return getCookie(event, useRuntimeConfig().public.directus.cookieNameAccessToken)
}

export function useDirectusUrl(): string {
  return useRuntimeConfig().public.directus.url
}

// TODO: Might need to change this to allow for conditional type based on auth, rest etc.
export function useDirectus(token?: string): DirectusClient<DirectusSchema> & AuthenticationClient<DirectusSchema> & RestClient<DirectusSchema> {
  const url = useDirectusUrl()

  if (!url)
    throw new Error('DIRECTUS_URL is not set in config options or .env file')

  const directus = createDirectus<DirectusSchema>(url).with(authentication('json', { autoRefresh: false })).with(rest())

  if (token)
    directus.setToken(token)

  return directus
}

// TODO: Might need to change this to allow for conditional type based on auth, rest etc.
export function useAdminDirectus(): DirectusClient<DirectusSchema> & AuthenticationClient<DirectusSchema> & RestClient<DirectusSchema> {
  const config = useRuntimeConfig().directus

  if (!config.adminToken)
    throw new Error('DIRECTUS_ADMIN_TOKEN is not set in config options or .env file')

  return useDirectus(config.adminToken)
}
