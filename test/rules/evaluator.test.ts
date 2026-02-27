import { describe, expect, it } from 'vitest'
import { evaluateFilter } from '../../src/rules'

describe('evaluateFilter', () => {
  describe('basic operators', () => {
    it('returns true for empty filter', () => {
      const item = { id: 1, name: 'Test' }
      expect(evaluateFilter({}, item)).toBe(true)
      expect(evaluateFilter(null, item)).toBe(true)
      expect(evaluateFilter(undefined, item)).toBe(true)
    })

    it('handles _eq operator', () => {
      const item = { id: 1, status: 'published' }

      expect(evaluateFilter({ status: { _eq: 'published' } }, item)).toBe(true)
      expect(evaluateFilter({ status: { _eq: 'draft' } }, item)).toBe(false)
    })

    it('handles _neq operator', () => {
      const item = { id: 1, status: 'published' }

      expect(evaluateFilter({ status: { _neq: 'draft' } }, item)).toBe(true)
      expect(evaluateFilter({ status: { _neq: 'published' } }, item)).toBe(false)
    })

    it('handles _gt operator', () => {
      const item = { id: 1, count: 10 }

      expect(evaluateFilter({ count: { _gt: 5 } }, item)).toBe(true)
      expect(evaluateFilter({ count: { _gt: 10 } }, item)).toBe(false)
      expect(evaluateFilter({ count: { _gt: 15 } }, item)).toBe(false)
    })

    it('handles _gte operator', () => {
      const item = { id: 1, count: 10 }

      expect(evaluateFilter({ count: { _gte: 5 } }, item)).toBe(true)
      expect(evaluateFilter({ count: { _gte: 10 } }, item)).toBe(true)
      expect(evaluateFilter({ count: { _gte: 15 } }, item)).toBe(false)
    })

    it('handles _lt operator', () => {
      const item = { id: 1, count: 10 }

      expect(evaluateFilter({ count: { _lt: 15 } }, item)).toBe(true)
      expect(evaluateFilter({ count: { _lt: 10 } }, item)).toBe(false)
      expect(evaluateFilter({ count: { _lt: 5 } }, item)).toBe(false)
    })

    it('handles _lte operator', () => {
      const item = { id: 1, count: 10 }

      expect(evaluateFilter({ count: { _lte: 15 } }, item)).toBe(true)
      expect(evaluateFilter({ count: { _lte: 10 } }, item)).toBe(true)
      expect(evaluateFilter({ count: { _lte: 5 } }, item)).toBe(false)
    })

    it('handles _in operator', () => {
      const item = { id: 1, status: 'published' }

      expect(evaluateFilter({ status: { _in: ['published', 'draft'] } }, item)).toBe(true)
      expect(evaluateFilter({ status: { _in: ['draft', 'archived'] } }, item)).toBe(false)
    })

    it('handles _nin operator', () => {
      const item = { id: 1, status: 'published' }

      expect(evaluateFilter({ status: { _nin: ['draft', 'archived'] } }, item)).toBe(true)
      expect(evaluateFilter({ status: { _nin: ['published', 'draft'] } }, item)).toBe(false)
    })

    it('handles _null operator', () => {
      expect(evaluateFilter({ field: { _null: true } }, { field: null })).toBe(true)
      expect(evaluateFilter({ field: { _null: true } }, { field: 'value' })).toBe(false)
      expect(evaluateFilter({ field: { _null: false } }, { field: 'value' })).toBe(true)
    })

    it('handles _nnull operator', () => {
      expect(evaluateFilter({ field: { _nnull: true } }, { field: 'value' })).toBe(true)
      expect(evaluateFilter({ field: { _nnull: true } }, { field: null })).toBe(false)
    })

    it('handles _empty operator', () => {
      expect(evaluateFilter({ field: { _empty: true } }, { field: '' })).toBe(true)
      expect(evaluateFilter({ field: { _empty: true } }, { field: null })).toBe(true)
      expect(evaluateFilter({ field: { _empty: true } }, { field: [] })).toBe(true)
      expect(evaluateFilter({ field: { _empty: true } }, { field: 'value' })).toBe(false)
    })

    it('handles _nempty operator', () => {
      expect(evaluateFilter({ field: { _nempty: true } }, { field: 'value' })).toBe(true)
      expect(evaluateFilter({ field: { _nempty: true } }, { field: '' })).toBe(false)
      expect(evaluateFilter({ field: { _nempty: true } }, { field: null })).toBe(false)
    })
  })

  describe('string operators', () => {
    it('handles _contains operator', () => {
      const item = { title: 'Hello World' }

      expect(evaluateFilter({ title: { _contains: 'World' } }, item)).toBe(true)
      expect(evaluateFilter({ title: { _contains: 'Foo' } }, item)).toBe(false)
    })

    it('handles _ncontains operator', () => {
      const item = { title: 'Hello World' }

      expect(evaluateFilter({ title: { _ncontains: 'Foo' } }, item)).toBe(true)
      expect(evaluateFilter({ title: { _ncontains: 'World' } }, item)).toBe(false)
    })

    it('handles _icontains operator (case insensitive)', () => {
      const item = { title: 'Hello World' }

      expect(evaluateFilter({ title: { _icontains: 'world' } }, item)).toBe(true)
      expect(evaluateFilter({ title: { _icontains: 'HELLO' } }, item)).toBe(true)
    })

    it('handles _starts_with operator', () => {
      const item = { title: 'Hello World' }

      expect(evaluateFilter({ title: { _starts_with: 'Hello' } }, item)).toBe(true)
      expect(evaluateFilter({ title: { _starts_with: 'World' } }, item)).toBe(false)
    })

    it('handles _istarts_with operator (case insensitive)', () => {
      const item = { title: 'Hello World' }

      expect(evaluateFilter({ title: { _istarts_with: 'hello' } }, item)).toBe(true)
    })

    it('handles _nstarts_with operator', () => {
      const item = { title: 'Hello World' }

      expect(evaluateFilter({ title: { _nstarts_with: 'World' } }, item)).toBe(true)
      expect(evaluateFilter({ title: { _nstarts_with: 'Hello' } }, item)).toBe(false)
    })

    it('handles _ends_with operator', () => {
      const item = { title: 'Hello World' }

      expect(evaluateFilter({ title: { _ends_with: 'World' } }, item)).toBe(true)
      expect(evaluateFilter({ title: { _ends_with: 'Hello' } }, item)).toBe(false)
    })

    it('handles _iends_with operator (case insensitive)', () => {
      const item = { title: 'Hello World' }

      expect(evaluateFilter({ title: { _iends_with: 'world' } }, item)).toBe(true)
    })

    it('handles _nends_with operator', () => {
      const item = { title: 'Hello World' }

      expect(evaluateFilter({ title: { _nends_with: 'Hello' } }, item)).toBe(true)
      expect(evaluateFilter({ title: { _nends_with: 'World' } }, item)).toBe(false)
    })
  })

  describe('range operators', () => {
    it('handles _between operator', () => {
      const item = { count: 10 }

      expect(evaluateFilter({ count: { _between: [5, 15] } }, item)).toBe(true)
      expect(evaluateFilter({ count: { _between: [10, 20] } }, item)).toBe(true)
      expect(evaluateFilter({ count: { _between: [15, 20] } }, item)).toBe(false)
    })

    it('handles _nbetween operator', () => {
      const item = { count: 10 }

      expect(evaluateFilter({ count: { _nbetween: [15, 20] } }, item)).toBe(true)
      expect(evaluateFilter({ count: { _nbetween: [5, 15] } }, item)).toBe(false)
    })
  })

  describe('logical operators', () => {
    it('handles _and operator', () => {
      const item = { status: 'published', author: 'user-1' }

      expect(
        evaluateFilter(
          {
            _and: [{ status: { _eq: 'published' } }, { author: { _eq: 'user-1' } }],
          },
          item,
        ),
      ).toBe(true)

      expect(
        evaluateFilter(
          {
            _and: [{ status: { _eq: 'published' } }, { author: { _eq: 'user-2' } }],
          },
          item,
        ),
      ).toBe(false)
    })

    it('handles _or operator', () => {
      const item = { status: 'published', author: 'user-1' }

      expect(
        evaluateFilter(
          {
            _or: [{ status: { _eq: 'draft' } }, { author: { _eq: 'user-1' } }],
          },
          item,
        ),
      ).toBe(true)

      expect(
        evaluateFilter(
          {
            _or: [{ status: { _eq: 'draft' } }, { author: { _eq: 'user-2' } }],
          },
          item,
        ),
      ).toBe(false)
    })

    it('handles nested logical operators', () => {
      const item = { status: 'published', author: 'user-1', type: 'article' }

      expect(
        evaluateFilter(
          {
            _and: [
              { status: { _eq: 'published' } },
              {
                _or: [{ type: { _eq: 'article' } }, { type: { _eq: 'page' } }],
              },
            ],
          },
          item,
        ),
      ).toBe(true)
    })
  })

  describe('dynamic variables', () => {
    it('resolves $CURRENT_USER', () => {
      const item = { author: 'user-123' }

      expect(
        evaluateFilter({ author: { _eq: '$CURRENT_USER' } }, item, { currentUser: 'user-123' }),
      ).toBe(true)

      expect(
        evaluateFilter({ author: { _eq: '$CURRENT_USER' } }, item, { currentUser: 'user-456' }),
      ).toBe(false)
    })

    it('resolves $CURRENT_ROLE', () => {
      const item = { role: 'role-123' }

      expect(
        evaluateFilter({ role: { _eq: '$CURRENT_ROLE' } }, item, { currentRole: 'role-123' }),
      ).toBe(true)
    })

    it('uses default values when context not provided', () => {
      const item = { author: 'test-user-id' }

      // Default currentUser is 'test-user-id'
      expect(evaluateFilter({ author: { _eq: '$CURRENT_USER' } }, item)).toBe(true)
    })
  })

  describe('relational operators', () => {
    it('handles _some operator', () => {
      const item = {
        id: 1,
        tags: [{ name: 'typescript' }, { name: 'javascript' }],
      }

      expect(
        evaluateFilter(
          {
            tags: { _some: { name: { _eq: 'typescript' } } },
          },
          item,
        ),
      ).toBe(true)

      expect(
        evaluateFilter(
          {
            tags: { _some: { name: { _eq: 'rust' } } },
          },
          item,
        ),
      ).toBe(false)
    })

    it('handles _none operator', () => {
      const item = {
        id: 1,
        tags: [{ name: 'typescript' }, { name: 'javascript' }],
      }

      expect(
        evaluateFilter(
          {
            tags: { _none: { name: { _eq: 'rust' } } },
          },
          item,
        ),
      ).toBe(true)

      expect(
        evaluateFilter(
          {
            tags: { _none: { name: { _eq: 'typescript' } } },
          },
          item,
        ),
      ).toBe(false)
    })
  })

  describe('nested field access', () => {
    it('handles nested object fields', () => {
      const item = {
        id: 1,
        author: {
          id: 'user-1',
          name: 'John',
        },
      }

      expect(
        evaluateFilter(
          {
            author: { id: { _eq: 'user-1' } },
          },
          item,
        ),
      ).toBe(true)

      expect(
        evaluateFilter(
          {
            author: { name: { _eq: 'Jane' } },
          },
          item,
        ),
      ).toBe(false)
    })
  })

  describe('multiple field filters', () => {
    it('combines multiple field filters with AND logic', () => {
      const item = { status: 'published', author: 'user-1', type: 'article' }

      expect(
        evaluateFilter(
          {
            status: { _eq: 'published' },
            author: { _eq: 'user-1' },
          },
          item,
        ),
      ).toBe(true)

      expect(
        evaluateFilter(
          {
            status: { _eq: 'published' },
            author: { _eq: 'user-2' },
          },
          item,
        ),
      ).toBe(false)
    })
  })
})
