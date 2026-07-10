import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  defineColadaLoader: vi.fn((...args: unknown[]) => ({ args, type: 'loader' })),
  nuxtApp: undefined as { runWithContext: ReturnType<typeof vi.fn> } | undefined,
  request: vi.fn(),
}))

vi.mock('vue-router/experimental/pinia-colada', () => ({
  defineColadaLoader: mocks.defineColadaLoader,
}))

vi.mock('#imports', () => ({
  tryUseNuxtApp: vi.fn(() => mocks.nuxtApp),
}))

vi.mock('../src/runtime/composables/directus', () => ({
  useDirectus: vi.fn(() => ({ request: mocks.request })),
}))

function passedOptions(): Record<string, unknown> {
  const args = mocks.defineColadaLoader.mock.calls.at(-1)
  return (typeof args?.[0] === 'string' ? args[1] : args?.[0]) as Record<string, unknown>
}

describe('defineDirectusLoader', () => {
  beforeEach(() => {
    mocks.defineColadaLoader.mockClear()
    mocks.nuxtApp = undefined
    mocks.request.mockReset()
  })

  it('forwards options to defineColadaLoader with a wrapped query', async () => {
    const { defineDirectusLoader } = await import('../src/runtime/colada/loaders')

    defineDirectusLoader({
      key: ['posts'],
      staleTime: 5_000,
      query: (directus: { request: (q: unknown) => Promise<unknown> }) => directus.request('q'),
    } as never)

    const options = passedOptions()
    expect(options.key).toEqual(['posts'])
    expect(options.staleTime).toBe(5_000)
    expect(options.query).toBeTypeOf('function')
  })

  it('supports the named-route overload', async () => {
    const { defineDirectusLoader } = await import('../src/runtime/colada/loaders')

    defineDirectusLoader('slug' as never, {
      key: ['pages'],
      query: async () => null,
    } as never)

    expect(mocks.defineColadaLoader.mock.calls.at(-1)?.[0]).toBe('slug')
    expect(passedOptions().key).toEqual(['pages'])
  })

  it('injects the directus client and route into the query', async () => {
    mocks.request.mockResolvedValueOnce([{ id: 1 }])
    const { defineDirectusLoader } = await import('../src/runtime/colada/loaders')

    const query = vi.fn((directus: { request: (q: unknown) => Promise<unknown> }) => directus.request('read'))
    defineDirectusLoader({ key: ['posts'], query } as never)

    const to = { params: { slug: 'home' } }
    const context = { signal: undefined }
    const wrapped = passedOptions().query as (to: unknown, context: unknown) => Promise<unknown>
    const result = await wrapped(to, context)

    expect(query).toHaveBeenCalledWith(expect.objectContaining({ request: mocks.request }), to, context)
    expect(mocks.request).toHaveBeenCalledWith('read')
    expect(result).toEqual([{ id: 1 }])
  })

  it('runs the query inside the nuxt context when available', async () => {
    mocks.nuxtApp = { runWithContext: vi.fn(fn => fn()) }
    mocks.request.mockResolvedValueOnce('ok')
    const { defineDirectusLoader } = await import('../src/runtime/colada/loaders')

    defineDirectusLoader({
      key: ['posts'],
      query: (directus: { request: (q: unknown) => Promise<unknown> }) => directus.request('read'),
    } as never)

    const wrapped = passedOptions().query as (to: unknown, context: unknown) => Promise<unknown>
    const result = await wrapped({}, {})

    expect(mocks.nuxtApp.runWithContext).toHaveBeenCalledTimes(1)
    expect(result).toBe('ok')
  })
})
