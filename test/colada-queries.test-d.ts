import type { UseQueryReturn } from '@pinia/colada'
import { describe, expectTypeOf, it } from 'vitest'
import { useDirectusItemQuery, useDirectusItemsQuery, useDirectusSingletonQuery } from '../src/runtime/colada/queries'

type TestPost = DirectusSchema['test_posts'][number]
type TestSettings = DirectusSchema['test_settings']

describe('colada query composable types', () => {
  it('returns typed collection data', () => {
    expectTypeOf(useDirectusItemsQuery('test_posts')).toEqualTypeOf<UseQueryReturn<TestPost[]>>()
  })

  it('returns typed item data', () => {
    expectTypeOf(useDirectusItemQuery('test_posts', 1)).toEqualTypeOf<UseQueryReturn<TestPost>>()
  })

  it('returns typed singleton data', () => {
    expectTypeOf(useDirectusSingletonQuery('test_settings')).toEqualTypeOf<UseQueryReturn<TestSettings>>()
  })

  it('accepts content version options on item and singleton reads', () => {
    useDirectusItemQuery('test_posts', 1, { query: { version: 'draft', versionRaw: true } })
    useDirectusSingletonQuery('test_settings', { query: { version: 'draft' } })
  })

  it('keeps regular and singleton collections separate', () => {
    // @ts-expect-error regular collections cannot use the singleton endpoint
    useDirectusSingletonQuery('test_posts')
    // @ts-expect-error singleton collections cannot use the list endpoint
    useDirectusItemsQuery('test_settings')
  })
})
