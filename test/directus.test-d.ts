import type { DirectusClient, RestClient } from '@directus/sdk'
import { describe, expectTypeOf, it } from 'vitest'
import { useDirectus } from '../src/runtime/composables/directus'

interface CustomSchema {
  posts: {
    id: number
    title: string
  }
}

describe('useDirectus', () => {
  it('defaults to the ambient DirectusSchema when no generic is passed', () => {
    expectTypeOf(useDirectus()).toMatchTypeOf<DirectusClient<DirectusSchema>>()
    expectTypeOf(useDirectus()).toMatchTypeOf<RestClient<DirectusSchema>>()
  })

  it('propagates a custom schema when one is provided', () => {
    expectTypeOf(useDirectus<CustomSchema>()).toMatchTypeOf<DirectusClient<CustomSchema>>()
    expectTypeOf(useDirectus<CustomSchema>()).toMatchTypeOf<RestClient<CustomSchema>>()
  })
})
