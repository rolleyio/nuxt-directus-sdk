import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeRuntimeConfig } from './fixtures/nuxt/runtime-config.data'

// Client-side tests: import.meta.client = true, import.meta.server = false
// We mock window.location.origin since vitest runs in Node

const MOCK_ORIGIN = 'http://localhost:3000'

let mockRuntimeConfig: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()

  mockRuntimeConfig = vi.fn()

  vi.doMock('#imports', () => ({
    useRuntimeConfig: mockRuntimeConfig,
    useRequestHeaders: vi.fn(() => ({})),
    useState: vi.fn((_key: string, init: () => unknown) => ({ value: init() })),
  }))

  // Mock window.location for client-side tests
  vi.stubGlobal('window', { location: { origin: MOCK_ORIGIN } })
})

function setConfig(overrides: Parameters<typeof makeRuntimeConfig>[0]) {
  mockRuntimeConfig.mockReturnValue(makeRuntimeConfig(overrides))
}

describe('useDirectusOriginUrl (client-side)', () => {
  it('prefers the runtime public URL over the build-time URL', async () => {
    setConfig({
      url: 'https://runtime.example.com',
      directusUrl: 'https://build.example.com',
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusOriginUrl()).toContain('runtime.example.com')
  })

  it('falls back to the build-time client URL when runtime URL is empty', async () => {
    setConfig({
      url: '',
      directusUrl: 'https://client.example.com',
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusOriginUrl()).toContain('client.example.com')
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

describe('useDirectusUrl (client-side)', () => {
  it('returns client URL when no proxy', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusUrl()).toContain('public.example.com')
  })

  it('does NOT use serverDirectusUrl on client', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://cms_directus:8055',
      proxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('public.example.com')
    expect(result).not.toContain('cms_directus')
  })

  it('with proxy enabled, uses window.location.origin + proxy path', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: { enabled: true, path: '/directus' },
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl('/items/posts')

    expect(result).toContain(MOCK_ORIGIN)
    expect(result).toContain('/directus')
    expect(result).toContain('/items/posts')
    expect(result).not.toContain('public.example.com')
  })

  it('with proxy enabled, uses default /directus path when not specified', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: { enabled: true },
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain(MOCK_ORIGIN)
    expect(result).toContain('/directus')
  })

  it('with proxy as boolean true, uses proxy path', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: true,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain(MOCK_ORIGIN)
    expect(result).toContain('/directus')
  })
})

describe('proxy disabled (client-side)', () => {
  it('proxy: false — uses client URL directly', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('public.example.com')
    expect(result).not.toContain(MOCK_ORIGIN)
    expect(result).not.toContain('/directus/')
  })

  it('proxy: { enabled: false } — uses client URL directly', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      proxy: { enabled: false, path: '/directus' },
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('public.example.com')
    expect(result).not.toContain('/directus/')
  })

  it('proxy: undefined — does NOT activate proxy, uses client URL', async () => {
    mockRuntimeConfig.mockReturnValue({
      public: {
        directus: {
          url: 'https://public.example.com',
          directusUrl: 'https://public.example.com',
          // proxy intentionally omitted (undefined)
        },
      },
      directus: {},
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('public.example.com')
    expect(result).not.toContain(MOCK_ORIGIN)
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

describe('proxy with { client, server } URL (client-side)', () => {
  it('proxy enabled — uses proxy path from window.location.origin', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      proxy: { enabled: true, path: '/api' },
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain(MOCK_ORIGIN)
    expect(result).toContain('/api')
    expect(result).not.toContain('internal:8055')
    expect(result).not.toContain('public.example.com')
  })

  it('proxy enabled — appends path correctly', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      proxy: { enabled: true, path: '/directus' },
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl('/items/posts')

    expect(result).toContain(MOCK_ORIGIN)
    expect(result).toContain('/directus')
    expect(result).toContain('/items/posts')
  })

  it('proxy disabled — uses client URL, never serverDirectusUrl', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      proxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('public.example.com')
    expect(result).not.toContain('internal:8055')
    expect(result).not.toContain(`${MOCK_ORIGIN}/directus`)
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

describe('simple string URL (client-side)', () => {
  it('useDirectusUrl returns the URL when only url is configured', async () => {
    setConfig({
      url: 'https://cms.example.com',
      directusUrl: 'https://cms.example.com',
      proxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusUrl()).toContain('cms.example.com')
  })

  it('useDirectusUrl appends path with simple string URL', async () => {
    setConfig({
      url: 'https://cms.example.com',
      directusUrl: 'https://cms.example.com',
      proxy: false,
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
      proxy: false,
    })

    const { useDirectusUrl, useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusUrl()).toBe(useDirectusOriginUrl())
  })

  it('useDirectusOriginUrl appends path correctly', async () => {
    setConfig({
      url: 'https://cms.example.com',
      directusUrl: 'https://cms.example.com',
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl('/auth/login/google')
    expect(result).toContain('cms.example.com')
    expect(result).toContain('/auth/login/google')
  })
})

describe('url as object { client, server } (client-side)', () => {
  it('useDirectusUrl returns client URL (not server URL)', async () => {
    setConfig({
      url: { client: 'https://public.example.com', server: 'http://internal:8055' },
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      proxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('public.example.com')
    expect(result).not.toContain('internal')
  })

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
})
