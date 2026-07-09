import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeRuntimeConfig } from './fixtures/nuxt/runtime-config.data'

// Server-side tests: import.meta.server = true, import.meta.client = false

let mockRuntimeConfig: ReturnType<typeof vi.fn>
let mockRequestHeaders: ReturnType<typeof vi.fn>
let mockRequestURL: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()

  mockRuntimeConfig = vi.fn()
  mockRequestHeaders = vi.fn(() => ({}))
  mockRequestURL = vi.fn(() => {
    throw new Error('No request context')
  })

  vi.doMock('#imports', () => ({
    useRuntimeConfig: mockRuntimeConfig,
    useRequestHeaders: mockRequestHeaders,
    useRequestURL: mockRequestURL,
    useState: vi.fn((_key: string, init: () => unknown) => ({ value: init() })),
  }))
})

function setConfig(overrides: Parameters<typeof makeRuntimeConfig>[0]) {
  mockRuntimeConfig.mockReturnValue(makeRuntimeConfig(overrides))
}

describe('useDirectusOriginUrl (server-side)', () => {
  it('returns directusUrl (the pre-resolved client URL)', async () => {
    setConfig({
      url: 'https://client.example.com',
      directusUrl: 'https://client.example.com',
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusOriginUrl()).toContain('client.example.com')
  })

  it('falls back to url when directusUrl is not set', async () => {
    setConfig({
      url: 'https://fallback.example.com',
      directusUrl: undefined,
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusOriginUrl()).toContain('fallback.example.com')
  })

  it('appends path correctly', async () => {
    setConfig({
      url: 'https://directus.example.com',
      directusUrl: 'https://directus.example.com',
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl('/auth/login/google?redirect=https://app.example.com')

    expect(result).toContain('directus.example.com')
    expect(result).toContain('/auth/login/google')
  })

  it('ignores proxy — always returns the real client URL', async () => {
    setConfig({
      url: 'https://directus.example.com',
      directusUrl: 'https://directus.example.com',
      proxy: { enabled: true, path: '/directus', wsPath: '/directus-ws' },
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl()

    expect(result).toContain('directus.example.com')
    expect(result).not.toContain('/directus/')
  })

  it('ignores serverDirectusUrl — always returns client URL', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl()

    expect(result).toContain('public.example.com')
    expect(result).not.toContain('internal')
  })
})

describe('useDirectusUrl (server-side)', () => {
  it('uses the incoming request URL protocol and host for proxy requests', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: { enabled: true, path: '/directus' },
    })
    mockRequestURL.mockReturnValue(new URL('https://app.example.com/current'))

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')

    expect(useDirectusUrl('/items/posts')).toBe('https://app.example.com/directus/items/posts/')
  })

  it('falls back to x-forwarded-proto when request URL context is unavailable', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: { enabled: true, path: '/directus' },
    })
    mockRequestHeaders.mockReturnValue({ 'host': 'app.example.com', 'x-forwarded-proto': 'https, http' })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')

    expect(useDirectusUrl()).toBe('https://app.example.com/directus/')
  })

  it('falls back to validated headers when the request URL protocol is invalid', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: { enabled: true, path: '/directus' },
    })
    mockRequestURL.mockReturnValue(new URL('javascript://app.example.com/current'))
    mockRequestHeaders.mockReturnValue({ 'host': 'app.example.com', 'x-forwarded-proto': 'https' })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')

    expect(useDirectusUrl()).toBe('https://app.example.com/directus/')
  })

  it('ignores invalid forwarded protocols', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: { enabled: true, path: '/directus' },
    })
    mockRequestHeaders.mockReturnValue({ 'host': 'app.example.com', 'x-forwarded-proto': 'javascript' })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')

    expect(useDirectusUrl()).toBe('http://app.example.com/directus/')
  })

  it('returns client URL when no proxy and no serverDirectusUrl', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: undefined,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusUrl()).toContain('public.example.com')
  })

  it('prefers runtime public url over baked directusUrl when no explicit serverDirectusUrl exists', async () => {
    setConfig({
      url: 'https://runtime.example.com',
      directusUrl: 'https://build.example.com',
      serverDirectusUrl: '',
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('runtime.example.com')
    expect(result).not.toContain('build.example.com')
  })

  it('returns serverDirectusUrl when set (Docker/K8s internal URL)', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://cms_directus:8055',
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('cms_directus:8055')
    expect(result).not.toContain('public.example.com')
  })

  it('appends path when using serverDirectusUrl', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://cms_directus:8055',
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl('/items/posts')

    expect(result).toContain('cms_directus:8055')
    expect(result).toContain('/items/posts')
  })

  it('with proxy enabled, uses proxy path from request headers', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://cms_directus:8055',
      proxy: { enabled: true, path: '/directus' },
    })
    mockRequestHeaders.mockReturnValue({ host: 'localhost:3000' })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl('/items/posts')

    expect(result).toContain('localhost:3000')
    expect(result).toContain('/directus')
    expect(result).toContain('/items/posts')
  })

  it('with proxy as boolean true, uses proxy path from request headers', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: true,
    })
    mockRequestHeaders.mockReturnValue({ host: 'localhost:3000' })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('localhost:3000')
    expect(result).toContain('/directus')
    expect(result).not.toContain('public.example.com')
  })
})

describe('proxy disabled (server-side)', () => {
  it('proxy: false — uses serverDirectusUrl directly', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      proxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('internal:8055')
    expect(result).not.toContain('localhost')
    expect(result).not.toContain('/directus')
  })

  it('proxy: { enabled: false } — uses serverDirectusUrl directly', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      proxy: { enabled: false, path: '/directus' },
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('internal:8055')
    expect(result).not.toContain('/directus/')
  })

  it('proxy: undefined — does NOT activate proxy, uses serverDirectusUrl', async () => {
    mockRuntimeConfig.mockReturnValue({
      public: {
        directus: {
          url: 'https://public.example.com',
          directusUrl: 'https://public.example.com',
          // proxy intentionally omitted (undefined)
        },
      },
      directus: {
        serverDirectusUrl: 'http://internal:8055',
      },
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('internal:8055')
    expect(result).not.toContain('localhost')
    expect(result).not.toContain('/directus')
  })

  it('proxy disabled with no serverDirectusUrl — uses client URL', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: undefined,
      proxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusUrl()).toContain('public.example.com')
  })
})

describe('proxy with { client, server } URL (server-side)', () => {
  it('proxy enabled — uses proxy path, not serverDirectusUrl', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      proxy: { enabled: true, path: '/api' },
    })
    mockRequestHeaders.mockReturnValue({ host: 'localhost:3000' })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('localhost:3000')
    expect(result).toContain('/api')
    expect(result).not.toContain('internal:8055')
    expect(result).not.toContain('public.example.com')
  })

  it('proxy disabled — uses serverDirectusUrl, not client URL', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      proxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('internal:8055')
    expect(result).not.toContain('public.example.com')
  })

  it('proxy enabled but no request headers — falls through to serverDirectusUrl', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      proxy: { enabled: true, path: '/directus' },
    })
    mockRequestHeaders.mockReturnValue({}) // no host header

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    // No host header means proxy can't build a URL, falls through to serverDirectusUrl
    expect(result).toContain('internal:8055')
  })

  it('useDirectusOriginUrl always returns client URL regardless of proxy', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      proxy: { enabled: true, path: '/directus' },
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl()

    expect(result).toContain('public.example.com')
    expect(result).not.toContain('internal')
    expect(result).not.toContain('/directus/')
  })
})

describe('simple string URL (server-side)', () => {
  it('useDirectusUrl returns the URL when only url is configured', async () => {
    setConfig({
      url: 'https://cms.example.com',
      directusUrl: 'https://cms.example.com',
      serverDirectusUrl: 'https://cms.example.com',
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusUrl()).toContain('cms.example.com')
  })

  it('useDirectusUrl appends path with simple string URL', async () => {
    setConfig({
      url: 'https://cms.example.com',
      directusUrl: 'https://cms.example.com',
      serverDirectusUrl: 'https://cms.example.com',
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl('/items/posts')
    expect(result).toContain('cms.example.com')
    expect(result).toContain('/items/posts')
  })

  it('useDirectusOriginUrl returns the same URL with simple string', async () => {
    setConfig({
      url: 'https://cms.example.com',
      directusUrl: 'https://cms.example.com',
      serverDirectusUrl: 'https://cms.example.com',
    })

    const { useDirectusUrl, useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusUrl()).toBe(useDirectusOriginUrl())
  })
})

describe('url as object { client, server } (server-side)', () => {
  it('useDirectusOriginUrl returns client URL', async () => {
    setConfig({
      url: { client: 'https://public.example.com', server: 'http://internal:8055' },
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl()

    expect(result).toContain('public.example.com')
    expect(result).not.toContain('internal')
  })

  it('useDirectusUrl returns server URL on SSR', async () => {
    setConfig({
      url: { client: 'https://public.example.com', server: 'http://internal:8055' },
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusUrl()).toContain('internal:8055')
  })

  it('backward compat: string url still works', async () => {
    setConfig({
      url: 'https://single-url.example.com',
      directusUrl: 'https://single-url.example.com',
      serverDirectusUrl: 'https://single-url.example.com',
    })

    const { useDirectusUrl, useDirectusOriginUrl } = await import('../src/runtime/composables/directus')

    expect(useDirectusUrl()).toContain('single-url.example.com')
    expect(useDirectusOriginUrl()).toContain('single-url.example.com')
  })
})
