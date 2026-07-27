import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  options: undefined as Record<string, unknown> | undefined,
  readItem: vi.fn((collection, id, query) => ({ collection, id, query, type: 'item' })),
  readItems: vi.fn((collection, query) => ({ collection, query, type: 'items' })),
  readSingleton: vi.fn((collection, query) => ({ collection, query, type: 'singleton' })),
  request: vi.fn(),
  useQuery: vi.fn((options) => {
    mocks.options = options
    return { data: undefined }
  }),
}))

vi.mock('@pinia/colada', () => ({
  useQuery: mocks.useQuery,
}))

vi.mock('@directus/sdk', () => ({
  readItem: mocks.readItem,
  readItems: mocks.readItems,
  readSingleton: mocks.readSingleton,
}))

vi.mock('../src/runtime/composables/directus', () => ({
  useDirectus: vi.fn(() => ({ request: mocks.request })),
}))

function currentKey(): unknown {
  const key = mocks.options?.key
  return typeof key === 'function' ? key() : key
}

describe('colada query composables', () => {
  beforeEach(() => {
    mocks.options = undefined
    mocks.readItem.mockClear()
    mocks.readItems.mockClear()
    mocks.readSingleton.mockClear()
    mocks.request.mockReset()
    mocks.useQuery.mockClear()
  })

  it('fetches collection items with a deterministic entry key', async () => {
    mocks.request.mockResolvedValueOnce([{ id: 1, title: 'Post', status: 'published' }])
    const { useDirectusItemsQuery } = await import('../src/runtime/colada/queries')

    const query = { filter: { status: { _eq: 'published' as const } } }
    useDirectusItemsQuery('test_posts', { query })

    expect(currentKey()).toEqual(['directus', 'items', 'test_posts', query])

    const result = await (mocks.options?.query as () => Promise<unknown>)()
    expect(mocks.readItems).toHaveBeenCalledWith('test_posts', query)
    expect(result).toEqual([{ id: 1, title: 'Post', status: 'published' }])
  })

  it('keys "no query" as a stable null segment', async () => {
    const { useDirectusItemsQuery } = await import('../src/runtime/colada/queries')

    useDirectusItemsQuery('test_posts')

    expect(currentKey()).toEqual(['directus', 'items', 'test_posts', null])
  })

  it('unwraps a reactive id into the key and refetch query', async () => {
    mocks.request.mockResolvedValueOnce({ id: 7, title: 'Draft', status: 'draft' })
    const { useDirectusItemQuery } = await import('../src/runtime/colada/queries')

    let id = 7
    useDirectusItemQuery('test_posts', () => id)

    expect(currentKey()).toEqual(['directus', 'item', 'test_posts', 7, null])

    id = 8
    expect(currentKey()).toEqual(['directus', 'item', 'test_posts', 8, null])

    await (mocks.options?.query as () => Promise<unknown>)()
    expect(mocks.readItem).toHaveBeenCalledWith('test_posts', 8, undefined)
  })

  it('forwards colada options and honours an explicit key', async () => {
    const { useDirectusSingletonQuery } = await import('../src/runtime/colada/queries')

    useDirectusSingletonQuery('test_settings', { key: ['settings'], staleTime: 60_000 })

    expect(mocks.options?.key).toEqual(['settings'])
    expect(mocks.options?.staleTime).toBe(60_000)

    mocks.request.mockResolvedValueOnce({ site_name: 'Example' })
    const result = await (mocks.options?.query as () => Promise<unknown>)()
    expect(mocks.readSingleton).toHaveBeenCalledWith('test_settings', undefined)
    expect(result).toEqual({ site_name: 'Example' })
  })
})
