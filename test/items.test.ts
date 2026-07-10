import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  handler: undefined as (() => Promise<unknown>) | undefined,
  options: undefined as Record<string, unknown> | undefined,
  readItem: vi.fn((collection, id, query) => ({ collection, id, query, type: 'item' })),
  readItems: vi.fn((collection, query) => ({ collection, query, type: 'items' })),
  readSingleton: vi.fn((collection, query) => ({ collection, query, type: 'singleton' })),
  request: vi.fn(),
  useAsyncData: vi.fn((key, handler, options) => {
    mocks.handler = handler
    mocks.options = options
    return { key }
  }),
}))

vi.mock('#imports', () => ({
  useAsyncData: mocks.useAsyncData,
}))

vi.mock('@directus/sdk', () => ({
  readItem: mocks.readItem,
  readItems: mocks.readItems,
  readSingleton: mocks.readSingleton,
}))

vi.mock('../src/runtime/composables/directus', () => ({
  useDirectus: vi.fn(() => ({ request: mocks.request })),
}))

describe('data composables', () => {
  beforeEach(() => {
    mocks.handler = undefined
    mocks.options = undefined
    mocks.readItem.mockClear()
    mocks.readItems.mockClear()
    mocks.readSingleton.mockClear()
    mocks.request.mockReset()
    mocks.useAsyncData.mockClear()
  })

  it('fetches collection items with a deterministic key', async () => {
    mocks.request.mockResolvedValueOnce([{ id: 1, title: 'Post', status: 'published' }])
    const { useDirectusItems } = await import('../src/runtime/composables/items')

    useDirectusItems('test_posts', { query: { filter: { status: { _eq: 'published' } } } })
    const result = await mocks.handler?.()

    expect(mocks.useAsyncData).toHaveBeenCalledWith(
      'directus:items:test_posts:{"filter":{"status":{"_eq":"published"}}}',
      expect.any(Function),
      {},
    )
    expect(result).toEqual([{ id: 1, title: 'Post', status: 'published' }])
  })

  it('fetches one item and forwards AsyncData options', async () => {
    mocks.request.mockResolvedValueOnce({ id: 7, title: 'Draft', status: 'draft' })
    const { useDirectusItem } = await import('../src/runtime/composables/items')

    useDirectusItem('test_posts', 7, { immediate: false, key: 'post-7' })
    await mocks.handler?.()

    expect(mocks.readItem).toHaveBeenCalledWith('test_posts', 7, undefined)
    expect(mocks.useAsyncData).toHaveBeenCalledWith('post-7', expect.any(Function), { immediate: false })
  })

  it('passes content version queries through and keys versions separately', async () => {
    mocks.request.mockResolvedValue({ id: 7, title: 'Draft title' })
    const { useDirectusItem } = await import('../src/runtime/composables/items')

    useDirectusItem('test_posts', 7, { query: { version: 'draft', versionRaw: true } })
    await mocks.handler?.()
    expect(mocks.readItem).toHaveBeenCalledWith('test_posts', 7, { version: 'draft', versionRaw: true })

    useDirectusItem('test_posts', 7)
    const draftKey = mocks.useAsyncData.mock.calls[0]?.[0]
    const publishedKey = mocks.useAsyncData.mock.calls[1]?.[0]
    expect(draftKey).not.toEqual(publishedKey)
  })

  it('passes content versions through to singleton reads', async () => {
    mocks.request.mockResolvedValueOnce({ site_name: 'Draft name' })
    const { useDirectusSingleton } = await import('../src/runtime/composables/items')

    useDirectusSingleton('test_settings', { query: { version: 'draft' } })
    await mocks.handler?.()

    expect(mocks.readSingleton).toHaveBeenCalledWith('test_settings', { version: 'draft' })
  })

  it('uses the singleton SDK command for singleton collections', async () => {
    mocks.request.mockResolvedValueOnce({ site_name: 'Example' })
    const { useDirectusSingleton } = await import('../src/runtime/composables/items')

    useDirectusSingleton('test_settings', { query: { fields: ['site_name'] } })
    const result = await mocks.handler?.()

    expect(mocks.readSingleton).toHaveBeenCalledWith('test_settings', { fields: ['site_name'] })
    expect(result).toEqual({ site_name: 'Example' })
  })
})
