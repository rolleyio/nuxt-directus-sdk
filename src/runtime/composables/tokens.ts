import { useDomain } from './domain'
import type { CookieOptions, CookieRef } from '#app'
import { useCookie, useNuxtApp, useRuntimeConfig } from '#app'

export function getCookieDomain(): string | undefined {
  const domain = useDomain()

  // TODO: better way to do this and all domains
  return domain.value.includes('localhost') || domain.value.includes('127.0.0.1') || domain.value.includes('0.0.0.0') ? undefined : `.${domain.value}`
}

function directusCookie<T>(name: string, cookieOptions: CookieOptions): CookieRef<T> {
  const nuxtApp = useNuxtApp() as { _cookies?: Record<string, CookieRef<T>> }

  nuxtApp._cookies = nuxtApp._cookies || {}

  if (nuxtApp._cookies[name])
    return nuxtApp._cookies[name]

  const cookie = useCookie<T>(name, cookieOptions)

  nuxtApp._cookies[name] = cookie
  return cookie
}

export interface DirectusTokens {
  accessToken: CookieRef<string | null>
  refreshToken: CookieRef<string | null>
  expires: CookieRef<number | null>
  expiresAt: CookieRef<number | null>
}

export function useDirectusTokens(): DirectusTokens {
  const config = useRuntimeConfig().public.directus

  const sharedOptions: CookieOptions = {
    sameSite: config.cookieSameSite,
    secure: config.cookieSecure,
    domain: getCookieDomain(),
  }

  function accessToken(): CookieRef<string | null> {
    return directusCookie(config.cookieNameAccessToken, {
      ...sharedOptions,
      maxAge: config.cookieMaxAge,
    })
  }

  function refreshToken(): CookieRef<string | null> {
    return directusCookie(config.cookieNameRefreshToken, {
      ...sharedOptions,
      maxAge: config.cookieMaxAgeRefreshToken,
    })
  }

  function expires(): CookieRef<number | null> {
    return directusCookie('directus_access_expires', {
      ...sharedOptions,
      maxAge: config.cookieMaxAge,
    })
  }

  function expiresAt(): CookieRef<number | null> {
    return directusCookie('directus_access_expires_at', {
      ...sharedOptions,
      maxAge: config.cookieMaxAge,
    })
  }

  return {
    accessToken: accessToken(),
    refreshToken: refreshToken(),
    expires: expires(),
    expiresAt: expiresAt(),
  }
}
