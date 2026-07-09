import type { Ref } from 'vue'
import { describe, expectTypeOf, it } from 'vitest'
import { useDirectusSubscription } from '../src/runtime/composables/subscription'

type RealtimePost = DirectusSchema['realtime_posts'][number]

describe('realtime subscription types', () => {
  it('returns collection-typed items', () => {
    const subscription = useDirectusSubscription('realtime_posts', { immediate: false })

    expectTypeOf(subscription.items).toEqualTypeOf<Ref<RealtimePost[]>>()
  })

  it('restricts keyField to collection fields', () => {
    useDirectusSubscription('realtime_posts', { keyField: 'slug' })
    // @ts-expect-error keyField must exist on the collection item
    useDirectusSubscription('realtime_posts', { keyField: 'missing' })
  })
})
