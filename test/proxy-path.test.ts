import { describe, expect, it } from 'vitest'
import { resolveProxyPath, stripProxyPrefix } from '../src/runtime/server/routes/directus-proxy-path'

describe('resolveProxyPath()', () => {
  it('returns the configured path when proxy is an object with a path', () => {
    expect(resolveProxyPath({ enabled: true, path: '/_content' })).toBe('/_content')
  })

  it('falls back to /directus when proxy is an object without a path', () => {
    expect(resolveProxyPath({ enabled: true })).toBe('/directus')
  })

  it('falls back to /directus when proxy is a boolean', () => {
    expect(resolveProxyPath(true)).toBe('/directus')
    expect(resolveProxyPath(false)).toBe('/directus')
  })

  it('falls back to /directus when proxy is undefined', () => {
    expect(resolveProxyPath(undefined)).toBe('/directus')
  })
})

describe('stripProxyPrefix()', () => {
  it('strips the default /directus prefix', () => {
    expect(stripProxyPrefix('/directus/items/posts', '/directus')).toBe('/items/posts')
  })

  // Regression test for #102: a custom proxy.path was mounted correctly but
  // never stripped, so the wrong URL was forwarded upstream.
  it('strips a custom proxy path', () => {
    expect(stripProxyPrefix('/_content/items/posts', '/_content')).toBe('/items/posts')
  })

  it('returns an empty path when the request hits the mount root', () => {
    expect(stripProxyPrefix('/directus', '/directus')).toBe('')
  })

  it('leaves the pathname untouched when it does not start with the proxy path', () => {
    expect(stripProxyPrefix('/other/items/posts', '/directus')).toBe('/other/items/posts')
  })
})
