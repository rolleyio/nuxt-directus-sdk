import type { CookieOptions, CookieRef } from '#app'
import { useCookie, useNuxtApp, useRuntimeConfig } from '#app'

function directusCookie<T>(name: string, cookieOptions: CookieOptions): CookieRef<T> {
  const nuxtApp = useNuxtApp() as { _cookies?: Record<string, CookieRef<T>> }

  nuxtApp._cookies = nuxtApp._cookies || {}

  if (nuxtApp._cookies[name])
    return nuxtApp._cookies[name]

  const cookie = useCookie<T>(name, cookieOptions as any)

  nuxtApp._cookies[name] = cookie
  return cookie
}

export interface DirectusTokens {
  directusUrl: CookieRef<string | null>
  accessToken: CookieRef<string | null>
  refreshToken: CookieRef<string | null>
  expires: CookieRef<number | null>
  expiresAt: CookieRef<number | null>
}

export function useDirectusTokens(): DirectusTokens {
  const config = useRuntimeConfig().public.directus

  const sharedOptions: CookieOptions = {
    sameSite: config.cookieSameSite as any,
    secure: config.cookieSecure,
    domain: config.cookieDomain,
  }

  function directusUrl(): CookieRef<string | null> {
    return directusCookie('directus_url', {
      ...sharedOptions,
      maxAge: config.cookieMaxAge,
    })
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
    directusUrl: directusUrl(),
    accessToken: accessToken(),
    refreshToken: refreshToken(),
    expires: expires(),
    expiresAt: expiresAt(),
  }
}
