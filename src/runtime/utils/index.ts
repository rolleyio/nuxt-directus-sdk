import { cleanDoubleSlashes, joinURL, withTrailingSlash } from 'ufo'

export { Slot } from './slot'

export function useUrl(base: string, ...paths: string[]): string {
  return cleanDoubleSlashes(withTrailingSlash(joinURL(base, '/', ...paths)))
}

export function isQueryParamEnabled(value: any) {
  return value === 'true' || value === '1' || value === true || value === 1
}
