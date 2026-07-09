import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtimeConfig = {
  public: {
    directus: {
      url: 'https://runtime.example.com',
      directusUrl: 'https://build.example.com',
    },
  },
  directus: {
    serverDirectusUrl: '',
  },
}

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn(() => runtimeConfig),
}))

describe('server useDirectusUrl', () => {
  beforeEach(() => {
    runtimeConfig.public.directus.url = 'https://runtime.example.com'
    runtimeConfig.public.directus.directusUrl = 'https://build.example.com'
    runtimeConfig.directus.serverDirectusUrl = ''
  })

  it('prefers the runtime public URL when no private server URL is set', async () => {
    const { useDirectusUrl } = await import('../src/runtime/server/services/directus')

    expect(useDirectusUrl('/items/posts')).toBe('https://runtime.example.com/items/posts/')
  })

  it('prefers an explicit private server URL', async () => {
    runtimeConfig.directus.serverDirectusUrl = 'http://directus:8055'
    const { useDirectusUrl } = await import('../src/runtime/server/services/directus')

    expect(useDirectusUrl()).toBe('http://directus:8055/')
  })

  it('falls back to the build-time URL when runtime URL is empty', async () => {
    runtimeConfig.public.directus.url = ''
    const { useDirectusUrl } = await import('../src/runtime/server/services/directus')

    expect(useDirectusUrl()).toBe('https://build.example.com/')
  })
})
