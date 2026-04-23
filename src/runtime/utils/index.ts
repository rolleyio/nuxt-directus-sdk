import { cleanDoubleSlashes, joinURL, withTrailingSlash } from 'ufo'

export { Slot } from './slot'

export function useUrl(base: string, ...paths: string[]): string {
  return cleanDoubleSlashes(withTrailingSlash(joinURL(base, '/', ...paths)))
}

// TODO: (eslint) revisit any types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isQueryParamEnabled(value: any) {
  return value === 'true' || value === '1' || value === true || value === 1
}
