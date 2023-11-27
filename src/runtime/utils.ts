import { cleanDoubleSlashes, joinURL, withTrailingSlash } from 'ufo'

export function useUrl(base: string, ...paths: string[]): string {
  return cleanDoubleSlashes(withTrailingSlash(joinURL(base, '/', ...paths)))
}
