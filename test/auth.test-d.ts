import type { ComputedRef, Ref } from 'vue'
import { describe, expectTypeOf, it } from 'vitest'
import { useDirectusAuth, useDirectusUser } from '../src/runtime/composables/auth'

describe('useDirectusUser', () => {
  it('returns Ref<DirectusUser | null>', () => {
    expectTypeOf(useDirectusUser()).toEqualTypeOf<Ref<DirectusUser | null>>()
  })
})

describe('useDirectusAuth', () => {
  it('loggedIn is ComputedRef<boolean>', () => {
    expectTypeOf(useDirectusAuth().loggedIn).toEqualTypeOf<ComputedRef<boolean>>()
  })

  it('readMe returns Promise<DirectusUser | null>', () => {
    expectTypeOf(useDirectusAuth().readMe).returns.resolves.toEqualTypeOf<DirectusUser | null>()
  })

  it('updateMe returns Promise<DirectusUser> (non-nullable)', () => {
    expectTypeOf(useDirectusAuth().updateMe).returns.resolves.toEqualTypeOf<DirectusUser>()
  })

  it('UpdateMeInput excludes role — users cannot escalate their own privileges', () => {
    type Input = Parameters<ReturnType<typeof useDirectusAuth>['updateMe']>[0]
    expectTypeOf<Input>().not.toHaveProperty('role')
  })

  it('UpdateMeInput excludes policies — users cannot escalate their own privileges', () => {
    type Input = Parameters<ReturnType<typeof useDirectusAuth>['updateMe']>[0]
    expectTypeOf<Input>().not.toHaveProperty('policies')
  })
})
