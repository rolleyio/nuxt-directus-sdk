import { beforeEach, describe, expect, it, vi } from 'vitest'

// Server-side tests: import.meta.server = true, import.meta.client = false

let mockRuntimeConfig: ReturnType<typeof vi.fn>
let mockRequestHeaders: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()

  mockRuntimeConfig = vi.fn()
  mockRequestHeaders = vi.fn(() => ({}))

  vi.doMock('#imports', () => ({
    useRuntimeConfig: mockRuntimeConfig,
    useRequestHeaders: mockRequestHeaders,
    useState: vi.fn((_key: string, init: () => unknown) => ({ value: init() })),
  }))
})

function setConfig(overrides: {
  url?: string | { client: string, server: string }
  directusUrl?: string
  serverDirectusUrl?: string
  devProxy?: boolean | { enabled: boolean, path?: string, wsPath?: string }
}) {
  mockRuntimeConfig.mockReturnValue({
    public: {
      directus: {
        url: overrides.url ?? 'https://public.example.com',
        directusUrl: overrides.directusUrl,
        devProxy: overrides.devProxy ?? false,
      },
    },
    directus: {
      serverDirectusUrl: overrides.serverDirectusUrl,
    },
  })
}

describe('useDirectusOriginUrl (server-side)', () => {
  it('returns directusUrl (the pre-resolved client URL)', async () => {
    setConfig({
      url: 'https://fallback.com',
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
      directusUrl: 'https://real.directus.com',
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl('/auth/login/google?redirect=http://localhost')

    expect(result).toContain('real.directus.com')
    expect(result).toContain('/auth/login/google')
  })

  it('ignores devProxy — always returns the real client URL', async () => {
    setConfig({
      directusUrl: 'https://real.directus.com',
      devProxy: { enabled: true, path: '/directus', wsPath: '/directus-ws' },
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl()

    expect(result).toContain('real.directus.com')
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
  it('returns client URL when no proxy and no serverDirectusUrl', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: undefined,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusUrl()).toContain('public.example.com')
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

  it('with devProxy enabled, uses proxy path from request headers', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://cms_directus:8055',
      devProxy: { enabled: true, path: '/directus' },
    })
    mockRequestHeaders.mockReturnValue({ host: 'localhost:3000' })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl('/items/posts')

    expect(result).toContain('localhost:3000')
    expect(result).toContain('/directus')
    expect(result).toContain('/items/posts')
  })

  it('with devProxy as boolean true, uses proxy path from request headers', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      devProxy: true,
    })
    mockRequestHeaders.mockReturnValue({ host: 'localhost:3000' })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('localhost:3000')
    expect(result).toContain('/directus')
    expect(result).not.toContain('public.example.com')
  })
})

describe('devProxy disabled (server-side)', () => {
  it('devProxy: false — uses serverDirectusUrl directly', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      devProxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('internal:8055')
    expect(result).not.toContain('localhost')
    expect(result).not.toContain('/directus')
  })

  it('devProxy: { enabled: false } — uses serverDirectusUrl directly', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      devProxy: { enabled: false, path: '/directus' },
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('internal:8055')
    expect(result).not.toContain('/directus/')
  })

  it('devProxy: undefined — does NOT activate proxy, uses serverDirectusUrl', async () => {
    mockRuntimeConfig.mockReturnValue({
      public: {
        directus: {
          url: 'https://public.example.com',
          directusUrl: 'https://public.example.com',
          // devProxy intentionally omitted (undefined)
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

  it('devProxy disabled with no serverDirectusUrl — uses client URL', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: undefined,
      devProxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    expect(useDirectusUrl()).toContain('public.example.com')
  })
})

describe('devProxy with { client, server } URL (server-side)', () => {
  it('devProxy enabled — uses proxy path, not serverDirectusUrl', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      devProxy: { enabled: true, path: '/api' },
    })
    mockRequestHeaders.mockReturnValue({ host: 'localhost:3000' })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('localhost:3000')
    expect(result).toContain('/api')
    expect(result).not.toContain('internal:8055')
    expect(result).not.toContain('public.example.com')
  })

  it('devProxy disabled — uses serverDirectusUrl, not client URL', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      devProxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('internal:8055')
    expect(result).not.toContain('public.example.com')
  })

  it('devProxy enabled but no request headers — falls through to serverDirectusUrl', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      devProxy: { enabled: true, path: '/directus' },
    })
    mockRequestHeaders.mockReturnValue({}) // no host header

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    // No host header means proxy can't build a URL, falls through to serverDirectusUrl
    expect(result).toContain('internal:8055')
  })

  it('useDirectusOriginUrl always returns client URL regardless of devProxy', async () => {
    setConfig({
      directusUrl: 'https://public.example.com',
      serverDirectusUrl: 'http://internal:8055',
      devProxy: { enabled: true, path: '/directus' },
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
