import { describe, expect, it } from 'vitest'
import {
  allOf,
  directusValidation,
  field,
  isStandardSchema,
  length,
  oneOf,
  oneOfValues,
  pattern,
  required,
} from '../../src/rules'

describe('directusValidation helpers', () => {
  describe('directusValidation()', () => {
    it('passes through validation object', () => {
      const validation = directusValidation({
        title: { _nnull: true, _regex: '^.{5,}$' },
        status: { _in: ['draft', 'published'] },
      })

      expect(validation).toEqual({
        title: { _nnull: true, _regex: '^.{5,}$' },
        status: { _in: ['draft', 'published'] },
      })
    })
  })

  describe('field()', () => {
    it('creates field-level validation', () => {
      const validation = field('title', { _nnull: true })
      expect(validation).toEqual({ title: { _nnull: true } })
    })

    it('supports multiple rules', () => {
      const validation = field('title', { _nnull: true, _regex: '^.{5,}$' })
      expect(validation).toEqual({ title: { _nnull: true, _regex: '^.{5,}$' } })
    })
  })

  describe('allOf()', () => {
    it('combines validations with AND logic', () => {
      const validation = allOf(field('title', { _nnull: true }), field('content', { _nnull: true }))

      expect(validation).toEqual({
        _and: [{ title: { _nnull: true } }, { content: { _nnull: true } }],
      })
    })
  })

  describe('oneOf()', () => {
    it('combines validations with OR logic', () => {
      const validation = oneOf(field('email', { _nnull: true }), field('phone', { _nnull: true }))

      expect(validation).toEqual({
        _or: [{ email: { _nnull: true } }, { phone: { _nnull: true } }],
      })
    })
  })

  describe('required()', () => {
    it('creates required field validation', () => {
      const validation = required('title')
      expect(validation).toEqual({ title: { _nnull: true } })
    })
  })

  describe('pattern()', () => {
    it('creates pattern validation with string', () => {
      const validation = pattern('slug', '^[a-z0-9-]+$')
      expect(validation).toEqual({ slug: { _regex: '^[a-z0-9-]+$' } })
    })

    it('creates pattern validation with RegExp', () => {
      const validation = pattern('slug', /^[a-z0-9-]+$/)
      expect(validation).toEqual({ slug: { _regex: '^[a-z0-9-]+$' } })
    })
  })

  describe('length()', () => {
    it('creates min length validation', () => {
      const validation = length('title', { min: 5 })
      expect(validation).toEqual({ title: { _regex: '^.{5,}$' } })
    })

    it('creates max length validation', () => {
      const validation = length('title', { max: 200 })
      expect(validation).toEqual({ title: { _regex: '^.{0,200}$' } })
    })

    it('creates min and max length validation', () => {
      const validation = length('title', { min: 5, max: 200 })
      expect(validation).toEqual({ title: { _regex: '^.{5,200}$' } })
    })
  })

  describe('oneOfValues()', () => {
    it('creates enum validation', () => {
      const validation = oneOfValues('status', ['draft', 'published', 'archived'])
      expect(validation).toEqual({ status: { _in: ['draft', 'published', 'archived'] } })
    })
  })

  describe('complex combinations', () => {
    it('can build complex validation rules', () => {
      const validation = allOf(
        required('title'),
        length('title', { min: 5, max: 200 }),
        required('content'),
        oneOfValues('status', ['draft', 'published']),
      )

      expect(validation).toEqual({
        _and: [
          { title: { _nnull: true } },
          { title: { _regex: '^.{5,200}$' } },
          { content: { _nnull: true } },
          { status: { _in: ['draft', 'published'] } },
        ],
      })
    })

    it('can nest logical operators', () => {
      const validation = allOf(required('name'), oneOf(required('email'), required('phone')))

      expect(validation).toEqual({
        _and: [
          { name: { _nnull: true } },
          {
            _or: [{ email: { _nnull: true } }, { phone: { _nnull: true } }],
          },
        ],
      })
    })
  })
})

describe('isStandardSchema', () => {
  it('returns false for non-objects', () => {
    expect(isStandardSchema(null)).toBe(false)
    expect(isStandardSchema(undefined)).toBe(false)
    expect(isStandardSchema('string')).toBe(false)
    expect(isStandardSchema(123)).toBe(false)
  })

  it('returns false for objects without ~standard', () => {
    expect(isStandardSchema({})).toBe(false)
    expect(isStandardSchema({ foo: 'bar' })).toBe(false)
  })

  it('returns false for invalid ~standard', () => {
    expect(isStandardSchema({ '~standard': null })).toBe(false)
    expect(isStandardSchema({ '~standard': 'string' })).toBe(false)
    expect(isStandardSchema({ '~standard': { version: 2 } })).toBe(false)
  })

  it('returns true for valid Standard Schema', () => {
    const mockSchema = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: () => ({ value: {} }),
      },
    }
    expect(isStandardSchema(mockSchema)).toBe(true)
  })
})
