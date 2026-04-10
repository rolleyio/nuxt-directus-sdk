import { describe, expect, it } from 'vitest'
import {
  allOf,
  createRulesTester,
  defineDirectusRules,
  directusValidation,
  length,
  loadRulesFromJson,
  oneOfValues,
  required,
  serializeToDirectusApi,
} from '../../src/rules'

// Realistic test schema
interface BlogSchema {
  posts: {
    id: number
    title: string
    slug: string
    content: string
    excerpt: string
    status: 'draft' | 'review' | 'published' | 'archived'
    author: string
    category: number
    tags: number[]
    featured_image: string
    published_at: string
    created_at: string
    updated_at: string
  }
  categories: {
    id: number
    name: string
    slug: string
    description: string
  }
  tags: {
    id: number
    name: string
    slug: string
  }
  users: {
    id: string
    email: string
    first_name: string
    last_name: string
    role: string
  }
  comments: {
    id: number
    post: number
    author_name: string
    author_email: string
    content: string
    status: 'pending' | 'approved' | 'spam'
    created_at: string
  }
}

describe('integration: Blog CMS Permissions', () => {
  // Define comprehensive rules for a blog CMS using the object-based API
  const rules = defineDirectusRules<BlogSchema>({
    roles: [
      // Public role - unauthenticated users
      {
        name: 'Public',
        description: 'Public access for unauthenticated users',
        policies: [
          {
            name: 'PublicRead',
            permissions: {
              posts: {
                read: {
                  fields: ['id', 'title', 'slug', 'excerpt', 'content', 'published_at', 'category', 'tags', 'featured_image'],
                  filter: { status: { _eq: 'published' } },
                },
              },
              categories: { read: '*' },
              tags: { read: '*' },
            },
          },
          {
            name: 'PublicComments',
            permissions: {
              comments: {
                create: {
                  fields: ['post', 'author_name', 'author_email', 'content'],
                  presets: { status: 'pending' },
                },
                read: {
                  fields: ['id', 'post', 'author_name', 'content', 'created_at'],
                  filter: { status: { _eq: 'approved' } },
                },
              },
            },
          },
        ],
      },
      // Author role - can write their own content
      {
        name: 'Author',
        description: 'Content authors who can create and edit their own posts',
        policies: [
          {
            name: 'AuthorPosts',
            appAccess: true,
            permissions: {
              posts: {
                create: {
                  fields: ['title', 'slug', 'content', 'excerpt', 'category', 'tags', 'featured_image'],
                  presets: { status: 'draft', author: '$CURRENT_USER' as any },
                  validation: directusValidation(allOf(
                    required('title'),
                    length('title', { min: 5, max: 200 }),
                    required('content'),
                    length('content', { min: 100 }),
                  )),
                },
                read: '*',
                update: {
                  fields: ['title', 'slug', 'content', 'excerpt', 'category', 'tags', 'featured_image', 'status'],
                  filter: {
                    _and: [
                      { author: { _eq: '$CURRENT_USER' } },
                      { status: { _in: ['draft', 'review'] } },
                    ],
                  },
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
              tags: { read: true },
            },
          },
        ],
      },
      // Editor role - can manage all content
      {
        name: 'Editor',
        description: 'Editors who can manage all content',
        policies: [
          {
            name: 'EditorContent',
            appAccess: true,
            permissions: {
              posts: { create: true, read: true, update: true, delete: true },
              categories: { create: true, read: true, update: true, delete: true },
              tags: { create: true, read: true, update: true, delete: true },
              comments: {
                read: '*',
                update: {
                  fields: ['status'],
                  validation: directusValidation(
                    oneOfValues('status', ['pending', 'approved', 'spam']),
                  ),
                },
                delete: true,
              },
            },
          },
        ],
      },
      // Admin role - full system access
      {
        name: 'Admin',
        description: 'System administrators with full access',
        policies: [
          {
            name: 'AdminAccess',
            adminAccess: true,
            enforceTfa: true,
            permissions: {},
          },
        ],
      },
    ],
  })

  const tester = createRulesTester(rules)

  describe('public role', () => {
    it('can read published posts', () => {
      expect(tester.can('Public', 'read', 'posts').allowed).toBe(true)
    })

    it('can only see published posts', () => {
      const published = { id: 1, title: 'Test', slug: 'test', content: '', excerpt: '', status: 'published' as const, author: '', category: 1, tags: [], featured_image: '', published_at: '', created_at: '', updated_at: '' }
      const draft = { ...published, status: 'draft' as const }

      expect(tester.itemMatchesFilter('Public', 'read', 'posts', published)).toBe(true)
      expect(tester.itemMatchesFilter('Public', 'read', 'posts', draft)).toBe(false)
    })

    it('cannot create, update, or delete posts', () => {
      expect(tester.can('Public', 'create', 'posts').allowed).toBe(false)
      expect(tester.can('Public', 'update', 'posts').allowed).toBe(false)
      expect(tester.can('Public', 'delete', 'posts').allowed).toBe(false)
    })

    it('can create comments with presets', () => {
      expect(tester.can('Public', 'create', 'comments').allowed).toBe(true)

      const presets = tester.getPresets('Public', 'create', 'comments')
      expect(presets).toEqual({ status: 'pending' })
    })

    it('can only read approved comments', () => {
      const approved = { id: 1, post: 1, author_name: '', author_email: '', content: '', status: 'approved' as const, created_at: '' }
      const pending = { ...approved, status: 'pending' as const }

      expect(tester.itemMatchesFilter('Public', 'read', 'comments', approved)).toBe(true)
      expect(tester.itemMatchesFilter('Public', 'read', 'comments', pending)).toBe(false)
    })

    it('has limited fields on post read', () => {
      const fields = tester.getAccessibleFields('Public', 'read', 'posts')
      expect(fields).toContain('title')
      expect(fields).toContain('content')
      expect(fields).not.toContain('author')
      expect(fields).not.toContain('updated_at')
    })
  })

  describe('author role', () => {
    it('can create posts with presets', () => {
      expect(tester.can('Author', 'create', 'posts').allowed).toBe(true)

      const presets = tester.getPresets('Author', 'create', 'posts')
      expect(presets).toEqual({ status: 'draft', author: '$CURRENT_USER' })
    })

    it('can read all posts', () => {
      expect(tester.can('Author', 'read', 'posts').allowed).toBe(true)
      expect(tester.getAccessibleFields('Author', 'read', 'posts')).toBe('*')
    })

    it('can only update own draft/review posts', () => {
      const ownDraft = { id: 1, title: '', slug: '', content: '', excerpt: '', status: 'draft' as const, author: 'user-1', category: 1, tags: [], featured_image: '', published_at: '', created_at: '', updated_at: '' }
      const ownPublished = { ...ownDraft, status: 'published' as const }
      const otherDraft = { ...ownDraft, author: 'user-2' }

      expect(tester.itemMatchesFilter('Author', 'update', 'posts', ownDraft, { currentUser: 'user-1' })).toBe(true)
      expect(tester.itemMatchesFilter('Author', 'update', 'posts', ownPublished, { currentUser: 'user-1' })).toBe(false)
      expect(tester.itemMatchesFilter('Author', 'update', 'posts', otherDraft, { currentUser: 'user-1' })).toBe(false)
    })

    it('can only delete own drafts', () => {
      const ownDraft = { id: 1, title: '', slug: '', content: '', excerpt: '', status: 'draft' as const, author: 'user-1', category: 1, tags: [], featured_image: '', published_at: '', created_at: '', updated_at: '' }
      const ownReview = { ...ownDraft, status: 'review' as const }

      expect(tester.itemMatchesFilter('Author', 'delete', 'posts', ownDraft, { currentUser: 'user-1' })).toBe(true)
      expect(tester.itemMatchesFilter('Author', 'delete', 'posts', ownReview, { currentUser: 'user-1' })).toBe(false)
    })

    it('cannot modify categories or tags', () => {
      expect(tester.can('Author', 'create', 'categories').allowed).toBe(false)
      expect(tester.can('Author', 'update', 'tags').allowed).toBe(false)
    })
  })

  describe('editor role', () => {
    it('has full access to posts', () => {
      expect(tester.can('Editor', 'create', 'posts').allowed).toBe(true)
      expect(tester.can('Editor', 'read', 'posts').allowed).toBe(true)
      expect(tester.can('Editor', 'update', 'posts').allowed).toBe(true)
      expect(tester.can('Editor', 'delete', 'posts').allowed).toBe(true)
    })

    it('can manage categories and tags', () => {
      expect(tester.can('Editor', 'create', 'categories').allowed).toBe(true)
      expect(tester.can('Editor', 'delete', 'tags').allowed).toBe(true)
    })

    it('can moderate comments', () => {
      expect(tester.can('Editor', 'update', 'comments').allowed).toBe(true)
      expect(tester.can('Editor', 'delete', 'comments').allowed).toBe(true)

      const fields = tester.getAccessibleFields('Editor', 'update', 'comments')
      expect(fields).toEqual(['status'])
    })
  })

  describe('admin role', () => {
    it('has admin access', () => {
      const result = tester.can('Admin', 'delete', 'users')
      expect(result.allowed).toBe(true)
      expect(result.reason).toBe('Admin access granted')
    })

    it('can access any collection', () => {
      expect(tester.can('Admin', 'read', 'posts').allowed).toBe(true)
      expect(tester.can('Admin', 'read', 'users').allowed).toBe(true)
      expect(tester.can('Admin', 'delete', 'comments').allowed).toBe(true)
    })

    it('has all fields accessible', () => {
      expect(tester.getAccessibleFields('Admin', 'read', 'posts')).toBe('*')
      expect(tester.getAccessibleFields('Admin', 'update', 'users')).toBe('*')
    })
  })

  describe('jSON roundtrip', () => {
    it('can export and import rules', () => {
      const json = JSON.stringify(rules, (key, value) => {
        if (value instanceof Map) {
          return Object.fromEntries(value)
        }
        return value
      })

      // Simple check that export works
      expect(json).toContain('Public')
      expect(json).toContain('Author')
      expect(json).toContain('Editor')
      expect(json).toContain('Admin')
    })
  })

  describe('directus API serialization', () => {
    it('serializes to Directus API format', () => {
      const payload = serializeToDirectusApi(rules)

      expect(payload.roles).toHaveLength(4)
      expect(payload.roles.map(r => r.name)).toEqual(['Public', 'Author', 'Editor', 'Admin'])

      // Check policies exist
      expect(payload.policies.length).toBeGreaterThan(0)

      // Check permissions exist
      expect(payload.permissions.length).toBeGreaterThan(0)

      // Verify a specific permission
      const publicPostRead = payload.permissions.find(
        p => p.collection === 'posts' && p.action === 'read' && p.permissions?.status?._eq === 'published',
      )
      expect(publicPostRead).toBeDefined()
    })
  })
})

describe('integration: Loading from JSON', () => {
  it('can define the same rules via JSON', () => {
    const jsonRules = {
      roles: [
        {
          name: 'Editor',
          policies: [
            {
              name: 'ContentEditor',
              appAccess: true,
              permissions: {
                posts: {
                  create: { fields: ['title', 'content'] },
                  read: true,
                  update: {
                    fields: ['title', 'content', 'status'],
                    filter: { author: { _eq: '$CURRENT_USER' } },
                  },
                  delete: { filter: { status: { _eq: 'draft' } } },
                },
              },
            },
          ],
        },
      ],
    }

    interface SimpleSchema {
      posts: { id: number, title: string, content: string, status: string, author: string }
    }

    const rules = loadRulesFromJson<SimpleSchema>(jsonRules)
    const tester = createRulesTester(rules)

    expect(tester.can('Editor', 'create', 'posts').allowed).toBe(true)
    expect(tester.can('Editor', 'read', 'posts').allowed).toBe(true)

    const ownPost = { id: 1, title: '', content: '', status: 'draft', author: 'user-1' }
    expect(tester.itemMatchesFilter('Editor', 'update', 'posts', ownPost, { currentUser: 'user-1' })).toBe(true)
    expect(tester.itemMatchesFilter('Editor', 'update', 'posts', ownPost, { currentUser: 'user-2' })).toBe(false)
  })
})

describe('integration: Normalization', () => {
  interface TestSchema {
    posts: { id: number, title: string, status: string }
    users: { id: string, name: string }
  }

  it('extracts inline policies and assigns UUIDs', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [{
        name: 'Editor',
        policies: [{
          name: 'Content',
          permissions: { posts: { read: true } },
        }],
      }],
    })

    const payload = serializeToDirectusApi(rules)

    // Policy should have an ID assigned
    expect(payload.policies).toHaveLength(1)
    expect(payload.policies[0]!.id).toBeDefined()
    expect(payload.policies[0]!.id).toMatch(/^[0-9a-f-]{36}$/) // UUID format

    // Role should reference the policy
    expect(payload.roles[0]!.policies).toHaveLength(1)
    expect(payload.roles[0]!.policies![0]).toBe(payload.policies[0]!.id)
  })

  it('preserves existing policy IDs', () => {
    const rules = defineDirectusRules<TestSchema>({
      policies: [{
        id: 'my-custom-id',
        name: 'Shared',
        permissions: { posts: { read: true } },
      }],
      roles: [{
        name: 'Editor',
        policies: [{ id: 'my-custom-id' }],
      }],
    })

    const payload = serializeToDirectusApi(rules)

    expect(payload.policies[0]!.id).toBe('my-custom-id')
    expect(payload.roles[0]!.policies![0]).toBe('my-custom-id')
  })

  it('deduplicates shared policies', () => {
    const rules = defineDirectusRules<TestSchema>({
      policies: [{
        id: 'shared-policy',
        name: 'Shared',
        permissions: { posts: { read: true } },
      }],
      roles: [
        { name: 'Editor', policies: [{ id: 'shared-policy' }] },
        { name: 'Viewer', policies: [{ id: 'shared-policy' }] },
      ],
    })

    const payload = serializeToDirectusApi(rules)

    // Only one policy should exist
    expect(payload.policies).toHaveLength(1)
    expect(payload.policies[0]!.name).toBe('Shared')

    // Both roles should reference the same policy
    expect(payload.roles[0]!.policies).toEqual(['shared-policy'])
    expect(payload.roles[1]!.policies).toEqual(['shared-policy'])
  })

  it('handles mix of standalone and inline policies', () => {
    const rules = defineDirectusRules<TestSchema>({
      policies: [{
        id: 'standalone',
        name: 'Standalone Policy',
        permissions: { users: { read: true } },
      }],
      roles: [{
        name: 'Editor',
        policies: [
          { id: 'standalone' },
          { name: 'Inline Policy', permissions: { posts: { read: true } } },
        ],
      }],
    })

    const payload = serializeToDirectusApi(rules)

    // Should have both policies
    expect(payload.policies).toHaveLength(2)
    expect(payload.policies.map(p => p.name)).toContain('Standalone Policy')
    expect(payload.policies.map(p => p.name)).toContain('Inline Policy')

    // Role should reference both
    expect(payload.roles[0]!.policies).toHaveLength(2)
    expect(payload.roles[0]!.policies![0]).toBe('standalone')
  })

  it('standalone policies without roles are included', () => {
    const rules = defineDirectusRules<TestSchema>({
      policies: [{
        id: 'orphan-policy',
        name: 'Orphan',
        permissions: { posts: { read: true } },
      }],
      roles: [],
    })

    const payload = serializeToDirectusApi(rules)

    expect(payload.policies).toHaveLength(1)
    expect(payload.policies[0]!.name).toBe('Orphan')
  })
})
