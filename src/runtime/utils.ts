import { cleanDoubleSlashes, joinURL, withoutTrailingSlash } from 'ufo'

// TODO: think there is a better way to do this / withTrailingSlash etc and allow asset paths?
export function useUrl(base: string, ...paths: string[]): string {
  return withoutTrailingSlash(cleanDoubleSlashes(joinURL(base, '/', ...paths)))
}
