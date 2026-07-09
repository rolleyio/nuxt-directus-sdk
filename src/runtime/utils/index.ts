import { cleanDoubleSlashes, joinURL, withTrailingSlash } from 'ufo'

export { Slot } from './slot'

export function useUrl(base: string, ...paths: string[]): string {
  return cleanDoubleSlashes(withTrailingSlash(joinURL(base, '/', ...paths)))
}

export { isSafeRedirectPath, resolveSafeRedirectPath } from './redirect'

export function isQueryParamEnabled(value: unknown) {
  return value === 'true' || value === '1' || value === true || value === 1
}

export function resolveForwardedProtocol(value: string | string[] | undefined): 'http' | 'https' | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  const protocol = raw?.split(',')[0]?.trim().toLowerCase()
  return protocol === 'http' || protocol === 'https' ? protocol : undefined
}
