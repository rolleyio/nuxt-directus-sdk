import { describe, expect, it } from 'vitest'
import { createRulesTester, defineDirectusRules } from '../../src/rules'

// Test schema type
interface TestSchema {
  posts: {
    id: number
    title: string
    content: string
    status: 'draft' | 'published'
    author: string
  }
  users: {
    id: string
    email: string
    name: string
  }
  categories: {
    id: number
    name: string
    slug: string
  }
}

describe('createRulesTester', () => {
  const rules = defineDirectusRules<TestSchema>({
    roles: [
      {
        name: 'Admin',
        policies: [{ name: 'AdminAccess', adminAccess: true, permissions: {} }],
      },
      {
        name: 'Editor',
        policies: [
          {
            name: 'ContentManagement',
            permissions: {
              posts: {
                create: { fields: ['title', 'content'] },
                read: { fields: '*' },
                update: {
                  fields: ['title', 'content', 'status'],
                  filter: { author: { _eq: '$CURRENT_USER' } },
                },
                delete: {
                  filter: {
                    _and: [
                      { author: { _eq: '$CURRENT_USER' } },
                      { status: { _eq: 'draft' } },
                    ],
                  },
                },
              },
              categories: { read: true },
            },
          },
        ],
      },
      {
        name: 'Viewer',
        policies: [
          {
            name: 'ReadOnly',
            permissions: {
              posts: {
                read: {
                  fields: ['id', 'title', 'status'],
                  filter: { status: { _eq: 'published' } },
                },
              },
            },
          },
        ],
      },
    ],
  })

  const tester = createRulesTester(rules)

  describe('can()', () => {
    it('returns allowed for permitted actions', () => {
      const result = tester.can('Editor', 'read', 'posts')
      expect(result.allowed).toBe(true)
    })

    it('returns not allowed for unpermitted actions', () => {
      const result = tester.can('Viewer', 'create', 'posts')
      expect(result.allowed).toBe(false)
    })

    it('returns allowed for admin access on any collection', () => {
      const result = tester.can('Admin', 'delete', 'users')
      expect(result.allowed).toBe(true)
      expect(result.reason).toBe('Admin access granted')
    })

    it('returns permission config when conditional', () => {
      const result = tester.can('Editor', 'update', 'posts')
      expect(result.allowed).toBe(true)
      expect(result.permission).toBeDefined()
      expect(result.permission!.filter).toEqual({ author: { _eq: '$CURRENT_USER' } })
    })

    it('handles role not found', () => {
      const result = tester.can('NonExistent', 'read', 'posts')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('not found')
    })

    it('can lookup by policy name', () => {
      const result = tester.can('ContentManagement', 'read', 'posts')
      expect(result.allowed).toBe(true)
    })
  })

  describe('itemMatchesFilter()', () => {
    it('returns true when item matches filter', () => {
      const item: TestSchema['posts'] = {
        id: 1,
        title: 'Test',
        content: 'Content',
        status: 'draft',
        author: 'user-123',
      }

      const matches = tester.itemMatchesFilter('Editor', 'update', 'posts', item, {
        currentUser: 'user-123',
      })

      expect(matches).toBe(true)
    })

    it('returns false when item does not match filter', () => {
      const item: TestSchema['posts'] = {
        id: 1,
        title: 'Test',
        content: 'Content',
        status: 'draft',
        author: 'user-456',
      }

      const matches = tester.itemMatchesFilter('Editor', 'update', 'posts', item, {
        currentUser: 'user-123',
      })

      expect(matches).toBe(false)
    })

    it('returns true when no filter exists', () => {
      const item: TestSchema['posts'] = {
        id: 1,
        title: 'Test',
        content: 'Content',
        status: 'draft',
        author: 'anyone',
      }

      const matches = tester.itemMatchesFilter('Editor', 'read', 'posts', item)
      expect(matches).toBe(true)
    })

    it('returns false when permission denied', () => {
      const item: TestSchema['posts'] = {
        id: 1,
        title: 'Test',
        content: 'Content',
        status: 'draft',
        author: 'user-123',
      }

      const matches = tester.itemMatchesFilter('Viewer', 'update', 'posts', item)
      expect(matches).toBe(false)
    })

    it('handles complex AND filters', () => {
      const draftItem: TestSchema['posts'] = {
        id: 1,
        title: 'Test',
        content: 'Content',
        status: 'draft',
        author: 'user-123',
      }

      const publishedItem: TestSchema['posts'] = {
        id: 2,
        title: 'Test',
        content: 'Content',
        status: 'published',
        author: 'user-123',
      }

      // Editor can delete own drafts
      expect(tester.itemMatchesFilter('Editor', 'delete', 'posts', draftItem, {
        currentUser: 'user-123',
      })).toBe(true)

      // Editor cannot delete own published posts
      expect(tester.itemMatchesFilter('Editor', 'delete', 'posts', publishedItem, {
        currentUser: 'user-123',
      })).toBe(false)
    })
  })

  describe('getAccessibleFields()', () => {
    it('returns specific fields when configured', () => {
      const fields = tester.getAccessibleFields('Editor', 'create', 'posts')
      expect(fields).toEqual(['title', 'content'])
    })

    it('returns * when all fields allowed', () => {
      const fields = tester.getAccessibleFields('Editor', 'read', 'posts')
      expect(fields).toBe('*')
    })

    it('returns * for admin access', () => {
      const fields = tester.getAccessibleFields('Admin', 'read', 'posts')
      expect(fields).toBe('*')
    })

    it('returns empty array when no permission', () => {
      const fields = tester.getAccessibleFields('Viewer', 'create', 'posts')
      expect(fields).toEqual([])
    })

    it('returns subset of fields for Viewer read', () => {
      const fields = tester.getAccessibleFields('Viewer', 'read', 'posts')
      expect(fields).toEqual(['id', 'title', 'status'])
    })
  })

  describe('canAccessField()', () => {
    it('returns true for allowed field', () => {
      expect(tester.canAccessField('Editor', 'create', 'posts', 'title')).toBe(true)
      expect(tester.canAccessField('Editor', 'create', 'posts', 'content')).toBe(true)
    })

    it('returns false for disallowed field', () => {
      expect(tester.canAccessField('Editor', 'create', 'posts', 'status')).toBe(false)
      expect(tester.canAccessField('Editor', 'create', 'posts', 'author')).toBe(false)
    })

    it('returns true for any field with * access', () => {
      expect(tester.canAccessField('Editor', 'read', 'posts', 'title')).toBe(true)
      expect(tester.canAccessField('Editor', 'read', 'posts', 'status')).toBe(true)
      expect(tester.canAccessField('Editor', 'read', 'posts', 'author')).toBe(true)
    })

    it('returns true for any field with admin access', () => {
      expect(tester.canAccessField('Admin', 'update', 'posts', 'status')).toBe(true)
    })
  })

  describe('getPresets()', () => {
    it('returns presets when configured', () => {
      const rulesWithPresets = defineDirectusRules<TestSchema>({
        roles: [
          {
            name: 'Editor',
            policies: [
              {
                name: 'Posts',
                permissions: {
                  posts: {
                    create: {
                      fields: ['title', 'content'],
                      presets: { status: 'draft', author: '$CURRENT_USER' },
                    },
                  },
                },
              },
            ],
          },
        ],
      })

      const testerWithPresets = createRulesTester(rulesWithPresets)
      const presets = testerWithPresets.getPresets('Editor', 'create', 'posts')

      expect(presets).toEqual({
        status: 'draft',
        author: '$CURRENT_USER',
      })
    })

    it('returns null when no presets', () => {
      const presets = tester.getPresets('Editor', 'read', 'posts')
      expect(presets).toBeNull()
    })

    it('returns null when permission denied', () => {
      const presets = tester.getPresets('Viewer', 'create', 'posts')
      expect(presets).toBeNull()
    })
  })

  describe('getRules()', () => {
    it('returns the underlying rules config', () => {
      const rulesConfig = tester.getRules()
      expect(rulesConfig.roles).toHaveLength(3)
      expect(rulesConfig.roles.map(r => r.name)).toEqual(['Admin', 'Editor', 'Viewer'])
    })
  })
})
