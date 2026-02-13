import { useRuntimeConfig } from '#imports'

import { describe, expect, it, vi } from 'vitest'

// Mock Nuxt's auto-imports
vi.mock('#app', () => ({
  useRuntimeConfig: vi.fn(),
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn(),
  useRequestHeaders: vi.fn(() => ({})),
  useState: vi.fn((key: string, init: () => any) => ({ value: init() })),
}))

// We need to set import.meta flags before importing the composable
// Vitest runs in Node (server-like), so import.meta.client = false, import.meta.server = true

describe('useDirectusOriginUrl', () => {
  function mockConfig(overrides: { url?: string, directusUrl?: string, devProxy?: any }) {
    const config = {
      public: {
        directus: {
          url: overrides.url ?? 'https://public.example.com',
          directusUrl: overrides.directusUrl,
          devProxy: overrides.devProxy ?? false,
        },
      },
    }
    vi.mocked(useRuntimeConfig).mockReturnValue(config as any)
    return config
  }

  it('returns directusUrl when set (bypasses proxy)', async () => {
    mockConfig({
      url: 'https://public.example.com',
      directusUrl: 'https://real.directus.com',
      devProxy: { enabled: true, path: '/directus' },
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl()

    expect(result).toContain('real.directus.com')
    expect(result).not.toContain('/directus/')
    expect(result).not.toContain('localhost')
  })

  it('falls back to url when directusUrl is not set', async () => {
    mockConfig({
      url: 'https://public.example.com',
      directusUrl: undefined,
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl()

    expect(result).toContain('public.example.com')
  })

  it('appends path correctly', async () => {
    mockConfig({
      url: 'https://example.com',
      directusUrl: 'https://real.directus.com',
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl('/auth/login/google?redirect=http://localhost')

    expect(result).toContain('real.directus.com')
    expect(result).toContain('/auth/login/google')
  })

  it('always returns real URL even when devProxy is enabled', async () => {
    mockConfig({
      url: 'https://public.example.com',
      directusUrl: 'https://real.directus.com',
      devProxy: { enabled: true, path: '/directus', wsPath: '/directus-ws' },
    })

    const { useDirectusOriginUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusOriginUrl()

    expect(result).toContain('real.directus.com')
    expect(result).not.toContain('/directus/')
  })
})

describe('useDirectusUrl', () => {
  function mockConfig(overrides: { url?: string, directusUrl?: string, devProxy?: any }) {
    const config = {
      public: {
        directus: {
          url: overrides.url ?? 'https://public.example.com',
          directusUrl: overrides.directusUrl,
          devProxy: overrides.devProxy ?? false,
        },
      },
    }
    vi.mocked(useRuntimeConfig).mockReturnValue(config as any)
    return config
  }

  it('returns static url when devProxy is disabled', async () => {
    mockConfig({
      url: 'https://public.example.com',
      devProxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('public.example.com')
  })

  it('returns static url when devProxy is explicitly disabled via object', async () => {
    mockConfig({
      url: 'https://public.example.com',
      devProxy: { enabled: false },
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl()

    expect(result).toContain('public.example.com')
  })

  it('appends path to url', async () => {
    mockConfig({
      url: 'https://public.example.com',
      devProxy: false,
    })

    const { useDirectusUrl } = await import('../src/runtime/composables/directus')
    const result = useDirectusUrl('/items/posts')

    expect(result).toContain('public.example.com')
    expect(result).toContain('/items/posts')
  })
})
