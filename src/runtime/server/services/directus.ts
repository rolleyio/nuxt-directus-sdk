import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk'
import { authentication, createDirectus, rest } from '@directus/sdk'
import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import type { DirectusSchema } from 'nuxt/app'
import { withTrailingSlash } from 'ufo'

import { useUrl } from '../../utils'
import { useRuntimeConfig } from '#imports'

export function useDirectusAccessToken(event: H3Event): string | undefined {
  return getCookie(event, useRuntimeConfig().public.directus.cookieNameAccessToken)
}

// TEST
// TODO: this is duplicated with frontend version, could be good to cleanup?
export function useDirectusUrl(path?: string): string {
  return useUrl(useRuntimeConfig().public.directus.url, '/', path ?? '')
}

// TEST generic type overwrites custom?
// TODO: Might need to change this to allow for conditional type based on auth, rest etc.
export function useDirectus<T extends object = DirectusSchema>(token?: string): DirectusClient<T> & AuthenticationClient<T> & RestClient<T> {
  const directus = createDirectus<T>(withTrailingSlash(useDirectusUrl()))
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  if (token)
    directus.setToken(token)

  return directus
}

// TEST generic type overwrites custom?
export function useAdminDirectus<T extends object = DirectusSchema>() {
  const config = useRuntimeConfig().directus

  if (!config.adminToken)
    throw new Error('DIRECTUS_ADMIN_TOKEN is not set in config options or .env file')

  return useDirectus<T>(config.adminToken)
}
