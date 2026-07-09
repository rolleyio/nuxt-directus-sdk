import type { AsyncData, NuxtError } from 'nuxt/app'
import { describe, expectTypeOf, it } from 'vitest'
import { useDirectusItem, useDirectusItems, useDirectusSingleton } from '../src/runtime/composables/items'

type TestPost = DirectusSchema['test_posts'][number]
type TestSettings = DirectusSchema['test_settings']

describe('data composable types', () => {
  it('returns typed collection data', () => {
    expectTypeOf(useDirectusItems('test_posts')).toEqualTypeOf<AsyncData<TestPost[] | undefined, NuxtError | undefined>>()
  })

  it('returns typed item data', () => {
    expectTypeOf(useDirectusItem('test_posts', 1)).toEqualTypeOf<AsyncData<TestPost | undefined, NuxtError | undefined>>()
  })

  it('returns typed singleton data', () => {
    expectTypeOf(useDirectusSingleton('test_settings')).toEqualTypeOf<AsyncData<TestSettings | undefined, NuxtError | undefined>>()
  })

  it('keeps regular and singleton collections separate', () => {
    // @ts-expect-error regular collections cannot use the singleton endpoint
    useDirectusSingleton('test_posts')
    // @ts-expect-error singleton collections cannot use the list endpoint
    useDirectusItems('test_settings')
  })
})
