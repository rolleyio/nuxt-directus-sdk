import { describe, expect, it } from 'vitest'
import { parseCsv, resolveNegatableBoolean } from '../src/cli/helpers'

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
