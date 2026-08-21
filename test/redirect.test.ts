import { describe, expect, it } from 'vitest'
import { isSafeRedirectPath, resolveSafeRedirectPath } from '../src/runtime/utils/redirect'

describe('isSafeRedirectPath', () => {
  it('allows absolute same-origin paths', () => {
    expect(isSafeRedirectPath('/dashboard')).toBe(true)
    expect(isSafeRedirectPath('/posts?x=1')).toBe(true)
    expect(isSafeRedirectPath('/a/b#hash')).toBe(true)
  })

  it('rejects protocol-relative and absolute URLs', () => {
    expect(isSafeRedirectPath('//evil.com')).toBe(false)
    expect(isSafeRedirectPath('https://evil.com')).toBe(false)
    expect(isSafeRedirectPath('javascript:alert(1)')).toBe(false)
  })
})

describe('resolveSafeRedirectPath', () => {
  it('decodes and validates encoded paths', () => {
    expect(resolveSafeRedirectPath(encodeURIComponent('/dashboard'))).toBe('/dashboard')
  })

  it('falls back for unsafe values', () => {
    expect(resolveSafeRedirectPath('//evil.com', '/')).toBe('/')
    expect(resolveSafeRedirectPath('https://evil.com', '/home')).toBe('/home')
  })
})
