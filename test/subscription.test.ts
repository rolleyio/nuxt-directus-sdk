import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
}))

vi.mock('#imports', async () => {
  const { ref, shallowRef } = await import('vue')
  return {
    onScopeDispose: vi.fn(),
    ref,
    shallowRef,
  }
})

vi.mock('../src/runtime/composables/directus', () => ({
  useDirectus: vi.fn(() => ({ subscribe: mocks.subscribe })),
}))

async function* messages(values: unknown[]) {
  for (const value of values)
    yield value
}

async function* pendingMessages() {
  await new Promise(() => {})
  yield undefined
}

describe('useDirectusSubscription', () => {
  beforeEach(() => {
    mocks.subscribe.mockReset()
  })

  it('subscribes without explicitly reconnecting the shared client', async () => {
    const unsubscribe = vi.fn()
    mocks.subscribe.mockResolvedValueOnce({ subscription: pendingMessages(), unsubscribe })
    const { useDirectusSubscription } = await import('../src/runtime/composables/subscription')
    const subscription = useDirectusSubscription('realtime_posts', { immediate: false })

    await subscription.connect()

    expect(mocks.subscribe).toHaveBeenCalledWith('realtime_posts', {})
    expect(subscription.status.value).toBe('open')
  })

  it('synchronizes init, create, update, and delete events by a custom key', async () => {
    mocks.subscribe.mockResolvedValueOnce({
      subscription: messages([
        { event: 'init', data: [{ id: 1, slug: 'first', title: 'First' }] },
        { event: 'create', data: [{ id: 2, slug: 'second', title: 'Second' }] },
        { event: 'update', data: [{ id: 1, slug: 'first', title: 'Updated' }] },
        { event: 'delete', data: ['second'] },
      ]),
      unsubscribe: vi.fn(),
    })
    const { useDirectusSubscription } = await import('../src/runtime/composables/subscription')
    const subscription = useDirectusSubscription('realtime_posts', {
      immediate: false,
      keyField: 'slug',
    })

    await subscription.connect()
    await vi.waitFor(() => expect(subscription.status.value).toBe('closed'))

    expect(subscription.items.value).toEqual([{ id: 1, slug: 'first', title: 'Updated' }])
  })

  it('surfaces subscription error events', async () => {
    const unsubscribe = vi.fn()
    mocks.subscribe.mockResolvedValueOnce({
      subscription: messages([{ event: 'error', error: { code: 'FORBIDDEN', message: 'Forbidden' } }]),
      unsubscribe,
    })
    const { useDirectusSubscription } = await import('../src/runtime/composables/subscription')
    const subscription = useDirectusSubscription('realtime_posts', { immediate: false })

    await subscription.connect()
    await vi.waitFor(() => expect(subscription.status.value).toBe('error'))

    expect(subscription.error.value?.message).toBe('Forbidden')
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('rejects list synchronization when the configured key is missing', async () => {
    mocks.subscribe.mockResolvedValueOnce({
      subscription: messages([{ event: 'init', data: [{ id: 1, slug: 'first', title: 'First' }] }]),
      unsubscribe: vi.fn(),
    })
    const { useDirectusSubscription } = await import('../src/runtime/composables/subscription')
    const subscription = useDirectusSubscription('realtime_posts', {
      immediate: false,
      keyField: 'missing' as never,
    })

    await subscription.connect()
    await vi.waitFor(() => expect(subscription.status.value).toBe('error'))
    expect(subscription.error.value?.message).toContain('missing')
  })

  it('does not let a stale connect overwrite the active subscription', async () => {
    let resolveFirst: (value: unknown) => void = () => {}
    const first = new Promise(resolve => resolveFirst = resolve)
    const staleUnsubscribe = vi.fn()
    mocks.subscribe
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce({ subscription: pendingMessages(), unsubscribe: vi.fn() })
    const { useDirectusSubscription } = await import('../src/runtime/composables/subscription')
    const subscription = useDirectusSubscription('realtime_posts', { immediate: false })

    const staleConnect = subscription.connect()
    await subscription.connect()
    resolveFirst({ subscription: pendingMessages(), unsubscribe: staleUnsubscribe })
    await staleConnect

    expect(staleUnsubscribe).toHaveBeenCalledOnce()
    expect(subscription.status.value).toBe('open')
  })

  it('unsubscribes and closes on disconnect', async () => {
    const unsubscribe = vi.fn()
    mocks.subscribe.mockResolvedValueOnce({ subscription: pendingMessages(), unsubscribe })
    const { useDirectusSubscription } = await import('../src/runtime/composables/subscription')
    const subscription = useDirectusSubscription('realtime_posts', { immediate: false })

    await subscription.connect()
    subscription.disconnect()

    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(subscription.status.value).toBe('closed')
  })
})
