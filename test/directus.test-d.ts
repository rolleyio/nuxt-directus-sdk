import type { DirectusClient, RestClient } from '@directus/sdk'
import type { H3Event } from 'h3'
import { describe, expectTypeOf, it } from 'vitest'
import { useDirectus } from '../src/runtime/composables/directus'
import { useAdminDirectus, useSessionDirectus, useTokenDirectus } from '../src/runtime/server/services/directus'

interface CustomSchema {
  posts: {
    id: number
    title: string
  }
}

const event = {} as H3Event

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

describe('useTokenDirectus', () => {
  it('defaults to the ambient DirectusSchema when no generic is passed', () => {
    expectTypeOf(useTokenDirectus()).toMatchTypeOf<DirectusClient<DirectusSchema>>()
  })

  it('propagates a custom schema when one is provided', () => {
    expectTypeOf(useTokenDirectus<CustomSchema>()).toMatchTypeOf<DirectusClient<CustomSchema>>()
  })
})

describe('useSessionDirectus', () => {
  it('defaults to the ambient DirectusSchema when no generic is passed', () => {
    expectTypeOf(useSessionDirectus(event)).toMatchTypeOf<DirectusClient<DirectusSchema>>()
  })

  it('propagates a custom schema when one is provided', () => {
    expectTypeOf(useSessionDirectus<CustomSchema>(event)).toMatchTypeOf<DirectusClient<CustomSchema>>()
  })
})

describe('useAdminDirectus', () => {
  it('defaults to the ambient DirectusSchema when no generic is passed', () => {
    expectTypeOf(useAdminDirectus()).toMatchTypeOf<DirectusClient<DirectusSchema>>()
  })

  it('propagates a custom schema when one is provided', () => {
    expectTypeOf(useAdminDirectus<CustomSchema>()).toMatchTypeOf<DirectusClient<CustomSchema>>()
  })
})
