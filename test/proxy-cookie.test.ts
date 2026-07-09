import { describe, expect, it } from 'vitest'
import { isRequestHttps, rewriteProxiedSetCookie } from '../src/runtime/server/routes/directus-cookie'

describe('isRequestHttps()', () => {
  it('detects HTTPS from the request URL', () => {
    expect(isRequestHttps(new URL('https://app.example.com'))).toBe(true)
  })

  it('detects HTTPS behind a TLS-terminating proxy', () => {
    expect(isRequestHttps(new URL('http://localhost'), 'HTTPS, http')).toBe(true)
    expect(isRequestHttps(new URL('http://localhost'), ['https'])).toBe(true)
  })

  it('does not treat other forwarded protocols as HTTPS', () => {
    expect(isRequestHttps(new URL('http://localhost'), 'javascript')).toBe(false)
  })
})

describe('rewriteProxiedSetCookie() — HTTPS (production/staging)', () => {
  it('preserves Secure and SameSite=None on HTTPS so cross-context flows keep working', () => {
    const input = 'directus_session_token=abc; Path=/; Domain=directus.example.com; Secure; HttpOnly; SameSite=None'
    const result = rewriteProxiedSetCookie(input, { isHttps: true })

    expect(result).toContain('Secure')
    expect(result).toContain('SameSite=None')
    expect(result).toContain('HttpOnly')
    expect(result).not.toContain('Domain=')
  })

  it('strips Domain on HTTPS so the cookie binds to the proxy origin', () => {
    const input = 'directus_session_token=abc; Path=/; Domain=directus.example.com; Secure; HttpOnly; SameSite=Lax'
    const result = rewriteProxiedSetCookie(input, { isHttps: true })

    expect(result).not.toContain('Domain=')
  })

  it('does not add a SameSite directive when one already exists', () => {
    const input = 'directus_session_token=abc; Path=/; SameSite=Strict'
    const result = rewriteProxiedSetCookie(input, { isHttps: true })

    expect(result).toBe(input)
  })
})

describe('rewriteProxiedSetCookie() — HTTP (localhost dev)', () => {
  it('strips Secure so the browser will accept the cookie over plain HTTP', () => {
    const input = 'directus_session_token=abc; Path=/; Domain=directus.example.com; Secure; HttpOnly; SameSite=Lax'
    const result = rewriteProxiedSetCookie(input, { isHttps: false })

    expect(result).not.toMatch(/Secure/)
  })

  it('downgrades SameSite=None to SameSite=Lax and strips Secure', () => {
    const input = 'directus_session_token=abc; Path=/; Domain=directus.example.com; Secure; SameSite=None'
    const result = rewriteProxiedSetCookie(input, { isHttps: false })

    expect(result).toContain('SameSite=Lax')
    expect(result).not.toContain('SameSite=None')
    expect(result).not.toMatch(/Secure/)
  })

  it('adds SameSite=Lax when the original cookie has no SameSite directive', () => {
    const input = 'directus_session_token=abc; Path=/; HttpOnly'
    const result = rewriteProxiedSetCookie(input, { isHttps: false })

    expect(result).toContain('SameSite=Lax')
  })

  it('strips Domain on HTTP too', () => {
    const input = 'directus_session_token=abc; Path=/; Domain=directus.example.com; SameSite=Lax'
    const result = rewriteProxiedSetCookie(input, { isHttps: false })

    expect(result).not.toContain('Domain=')
  })

  it('does not duplicate SameSite when one is already present', () => {
    const input = 'directus_session_token=abc; Path=/; SameSite=Lax'
    const result = rewriteProxiedSetCookie(input, { isHttps: false })

    const sameSiteMatches = result.match(/SameSite=/gi) || []
    expect(sameSiteMatches).toHaveLength(1)
  })
})
