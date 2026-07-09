import { describe, expect, it } from 'vitest'
import type { DirectusRulesPayload } from '../src/rules'
import { parseCsv, prepareRulesPayload, resolveNegatableBoolean } from '../src/cli/helpers'

describe('prepareRulesPayload()', () => {
  it('injects the same defaults used by pushRules without mutating input', () => {
    const payload = {
      roles: [{ name: 'Editor', policies: ['policy-1'] }],
      policies: [{ id: 'policy-1', name: 'Content' }],
      permissions: [],
    } as unknown as DirectusRulesPayload
    const original = structuredClone(payload)

    const { rules, serialized } = prepareRulesPayload(payload)

    expect(serialized.roles[0]).toMatchObject({
      icon: 'supervised_user_circle',
      description: null,
      parent: null,
    })
    expect(serialized.policies[0]).toMatchObject({
      icon: 'badge',
      description: null,
      ip_access: null,
      enforce_tfa: false,
      admin_access: false,
      app_access: true,
    })
    expect(rules.roles[0]!.policies[0]).toBe(rules.policies[0])
    expect(payload).toEqual(original)
  })
})

describe('parseCsv()', () => {
  it('returns an empty array for undefined', () => {
    expect(parseCsv(undefined)).toEqual([])
  })

  it('returns an empty array for an empty string', () => {
    expect(parseCsv('')).toEqual([])
  })

  it('parses a single value', () => {
    expect(parseCsv('posts')).toEqual(['posts'])
  })

  it('parses multiple comma-separated values', () => {
    expect(parseCsv('posts,pages,users')).toEqual(['posts', 'pages', 'users'])
  })

  it('trims whitespace around each value', () => {
    expect(parseCsv(' posts , pages ,users ')).toEqual(['posts', 'pages', 'users'])
  })

  it('drops empty entries from repeated or trailing commas', () => {
    expect(parseCsv('posts,,pages,')).toEqual(['posts', 'pages'])
  })

  it('drops entries that are only whitespace', () => {
    expect(parseCsv('posts, ,pages')).toEqual(['posts', 'pages'])
  })
})

describe('resolveNegatableBoolean()', () => {
  it('returns the fallback when neither flag is set', () => {
    expect(resolveNegatableBoolean(undefined, undefined, true)).toBe(true)
    expect(resolveNegatableBoolean(undefined, undefined, false)).toBe(false)
  })

  it('returns false when the negative flag is set, regardless of positive', () => {
    expect(resolveNegatableBoolean(undefined, true, true)).toBe(false)
    expect(resolveNegatableBoolean(true, true, true)).toBe(false)
    expect(resolveNegatableBoolean(false, true, true)).toBe(false)
  })

  it('returns the positive flag value when only the positive is set', () => {
    expect(resolveNegatableBoolean(true, undefined, false)).toBe(true)
    expect(resolveNegatableBoolean(false, undefined, true)).toBe(false)
  })

  it('treats a false negative as "not set"', () => {
    // parseArgs may give us `false` when the flag wasn't passed but has no default,
    // or undefined. Only a truthy negative should win.
    expect(resolveNegatableBoolean(true, false, false)).toBe(true)
    expect(resolveNegatableBoolean(undefined, false, true)).toBe(true)
  })
})
