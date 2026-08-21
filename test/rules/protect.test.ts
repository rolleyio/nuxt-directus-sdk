import { describe, expect, it } from 'vitest'
import { isProtectedPolicy, isProtectedRole } from '../../src/rules/sync/protect'

describe('isProtectedRole', () => {
  it('protects Administrator and Public', () => {
    expect(isProtectedRole({ name: 'Administrator' })).toBe(true)
    expect(isProtectedRole({ name: 'Public' })).toBe(true)
    expect(isProtectedRole({ name: '$t:public_label' })).toBe(true)
  })

  it('allows custom roles', () => {
    expect(isProtectedRole({ name: 'Editor' })).toBe(false)
  })
})

describe('isProtectedPolicy', () => {
  it('protects admin_access policies regardless of name', () => {
    expect(isProtectedPolicy({
      name: 'Custom Admin',
      admin_access: true,
    })).toBe(true)
  })

  it('protects known system policy names', () => {
    expect(isProtectedPolicy({ name: 'Administrator', admin_access: false })).toBe(true)
    expect(isProtectedPolicy({ name: 'Public', admin_access: false })).toBe(true)
    expect(isProtectedPolicy({ name: '$t:admin_policy', admin_access: false })).toBe(true)
  })

  it('allows custom app policies', () => {
    expect(isProtectedPolicy({ name: 'Content', admin_access: false })).toBe(false)
  })
})
