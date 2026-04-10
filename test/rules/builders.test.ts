import { describe, expect, it } from 'vitest'
import { defineDirectusRules } from '../../src/rules'

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

describe('defineDirectusRules', () => {
  it('creates empty rules', () => {
    const rules = defineDirectusRules<TestSchema>({})

    expect(rules.roles).toEqual([])
    expect(rules.policies).toEqual([])
  })

  it('creates rules with a role', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Editor',
          description: 'Content editors',
          policies: [],
        },
      ],
    })

    expect(rules.roles).toHaveLength(1)
    expect(rules.roles[0]!.name).toBe('Editor')
    expect(rules.roles[0]!.description).toBe('Content editors')
  })

  it('creates rules with multiple roles', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        { name: 'Editor', description: 'Editors', policies: [] },
        { name: 'Admin', description: 'Administrators', policies: [] },
      ],
    })

    expect(rules.roles).toHaveLength(2)
    expect(rules.roles[0]!.name).toBe('Editor')
    expect(rules.roles[1]!.name).toBe('Admin')
  })

  it('creates standalone policies', () => {
    const rules = defineDirectusRules<TestSchema>({
      policies: [
        {
          name: 'ReadPosts',
          description: 'Can read posts',
          permissions: {
            posts: { read: true },
          },
        },
      ],
    })

    expect(rules.policies).toHaveLength(1)
    expect(rules.policies[0]!.name).toBe('ReadPosts')
  })
})

describe('role configuration', () => {
  it('sets role properties', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          id: 'custom-id',
          name: 'Editor',
          icon: 'edit',
          description: 'Content editors',
          parent: 'BaseRole',
          policies: [],
        },
      ],
    })

    const role = rules.roles[0]!
    expect(role.id).toBe('custom-id')
    expect(role.icon).toBe('edit')
    expect(role.description).toBe('Content editors')
    expect(role.parent).toBe('BaseRole')
  })

  it('adds policies to role', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Editor',
          policies: [
            { name: 'PostAccess', permissions: { posts: { read: true } } },
            { name: 'CategoryAccess', permissions: { categories: { read: true } } },
          ],
        },
      ],
    })

    const role = rules.roles[0]!
    expect(role.policies).toHaveLength(2)
    expect(role.policies[0]!.name).toBe('PostAccess')
    expect(role.policies[1]!.name).toBe('CategoryAccess')
  })
})

describe('policy configuration', () => {
  it('sets policy properties', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Admin',
          policies: [
            {
              id: 'admin-policy-id',
              name: 'AdminPolicy',
              icon: 'admin',
              description: 'Full admin access',
              ipAccess: ['192.168.1.0/24'],
              enforceTfa: true,
              adminAccess: true,
              appAccess: false,
              permissions: {},
            },
          ],
        },
      ],
    })

    const policy = rules.roles[0]!.policies[0]!
    expect(policy.id).toBe('admin-policy-id')
    expect(policy.icon).toBe('admin')
    expect(policy.description).toBe('Full admin access')
    expect(policy.ipAccess).toEqual(['192.168.1.0/24'])
    expect(policy.enforceTfa).toBe(true)
    expect(policy.adminAccess).toBe(true)
    expect(policy.appAccess).toBe(false)
  })

  it('leaves appAccess undefined when not specified', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Editor',
          policies: [{ name: 'Content', permissions: {} }],
        },
      ],
    })

    const policy = rules.roles[0]!.policies[0]!
    expect(policy.appAccess).toBeUndefined()
  })

  it('adds collection permissions', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Editor',
          policies: [
            {
              name: 'Content',
              permissions: {
                posts: { create: true, read: true, update: true, delete: false },
              },
            },
          ],
        },
      ],
    })

    const policy = rules.roles[0]!.policies[0]!
    const postsPerms = policy.permissions.get('posts')
    expect(postsPerms).toBeDefined()
    expect(postsPerms!.create).toBe(true)
    expect(postsPerms!.read).toBe(true)
    expect(postsPerms!.update).toBe(true)
    expect(postsPerms!.delete).toBe(false)
  })
})

describe('permission configuration', () => {
  it('configures CRUD permissions with detailed config', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Editor',
          policies: [
            {
              name: 'Posts',
              permissions: {
                posts: {
                  create: { fields: ['title', 'content'] },
                  read: { fields: '*' },
                  update: { fields: ['title', 'content', 'status'] },
                  delete: { filter: { status: { _eq: 'draft' } } },
                  share: true,
                },
              },
            },
          ],
        },
      ],
    })

    const perms = rules.roles[0]!.policies[0]!.permissions.get('posts')!

    // Create
    expect(perms.create).toEqual({ fields: ['title', 'content'] })

    // Read
    expect(perms.read).toEqual({ fields: '*' })

    // Update
    expect(perms.update).toEqual({ fields: ['title', 'content', 'status'] })

    // Delete
    expect(perms.delete).toEqual({ filter: { status: { _eq: 'draft' } } })

    // Share
    expect(perms.share).toBe(true)
  })

  it('supports shorthand * for all fields', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Reader',
          policies: [
            {
              name: 'ReadOnly',
              permissions: {
                posts: { read: '*' },
              },
            },
          ],
        },
      ],
    })

    const readPerm = rules.roles[0]!.policies[0]!.permissions.get('posts')!.read
    expect(readPerm).toEqual({ fields: '*' })
  })

  it('supports permission config with filter', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Author',
          policies: [
            {
              name: 'OwnPosts',
              permissions: {
                posts: {
                  update: {
                    fields: ['title', 'content'],
                    filter: { author: { _eq: '$CURRENT_USER' } },
                  },
                },
              },
            },
          ],
        },
      ],
    })

    const updatePerm = rules.roles[0]!.policies[0]!.permissions.get('posts')!.update
    expect(updatePerm).toEqual({
      fields: ['title', 'content'],
      filter: { author: { _eq: '$CURRENT_USER' } },
    })
  })

  it('supports permission config with presets', () => {
    const rules = defineDirectusRules<TestSchema>({
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
                    presets: { status: 'draft', author: '$CURRENT_USER' as any },
                  },
                },
              },
            },
          ],
        },
      ],
    })

    const createPerm = rules.roles[0]!.policies[0]!.permissions.get('posts')!.create
    expect(createPerm).toEqual({
      fields: ['title', 'content'],
      presets: { status: 'draft', author: '$CURRENT_USER' },
    })
  })

  it('supports mixed boolean and config permissions', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Editor',
          policies: [
            {
              name: 'Mixed',
              permissions: {
                posts: {
                  create: true,
                  read: '*',
                  update: { fields: ['title'] },
                  delete: false,
                },
              },
            },
          ],
        },
      ],
    })

    const perms = rules.roles[0]!.policies[0]!.permissions.get('posts')!
    expect(perms.create).toBe(true)
    expect(perms.read).toEqual({ fields: '*' })
    expect(perms.update).toEqual({ fields: ['title'] })
    expect(perms.delete).toBe(false)
  })
})

describe('admin access', () => {
  it('creates admin role with admin access', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Admin',
          policies: [
            {
              name: 'Full Access',
              adminAccess: true,
              permissions: {},
            },
          ],
        },
      ],
    })

    const policy = rules.roles[0]!.policies[0]!
    expect(policy.adminAccess).toBe(true)
  })
})

describe('complex rules', () => {
  it('creates a complete CMS permission structure', () => {
    const rules = defineDirectusRules<TestSchema>({
      roles: [
        {
          name: 'Public',
          policies: [
            {
              name: 'PublicRead',
              permissions: {
                posts: { read: { filter: { status: { _eq: 'published' } } } },
                categories: { read: true },
              },
            },
          ],
        },
        {
          name: 'Editor',
          policies: [
            {
              name: 'ContentManagement',
              appAccess: true,
              permissions: {
                posts: {
                  create: { presets: { status: 'draft', author: '$CURRENT_USER' as any } },
                  read: '*',
                  update: { filter: { author: { _eq: '$CURRENT_USER' } } },
                  delete: { filter: { status: { _eq: 'draft' } } },
                },
                categories: { read: true },
              },
            },
          ],
        },
        {
          name: 'Admin',
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

    expect(rules.roles).toHaveLength(3)

    // Public
    const publicRole = rules.roles[0]!
    expect(publicRole.name).toBe('Public')
    expect(publicRole.policies[0]!.permissions.get('posts')!.read).toEqual({
      filter: { status: { _eq: 'published' } },
    })

    // Editor
    const editorRole = rules.roles[1]!
    expect(editorRole.name).toBe('Editor')
    expect(editorRole.policies[0]!.appAccess).toBe(true)
    expect(editorRole.policies[0]!.permissions.get('posts')!.create).toEqual({
      presets: { status: 'draft', author: '$CURRENT_USER' },
    })

    // Admin
    const adminRole = rules.roles[2]!
    expect(adminRole.name).toBe('Admin')
    expect(adminRole.policies[0]!.adminAccess).toBe(true)
    expect(adminRole.policies[0]!.enforceTfa).toBe(true)
  })
})

describe('policy references', () => {
  it('resolves policy reference by ID', () => {
    const rules = defineDirectusRules<TestSchema>({
      policies: [{
        id: 'shared-policy',
        name: 'Shared',
        permissions: { posts: { read: true } },
      }],
      roles: [{
        name: 'Editor',
        policies: [{ id: 'shared-policy' }],
      }],
    })

    expect(rules.roles[0]!.policies[0]!.name).toBe('Shared')
    expect(rules.roles[0]!.policies[0]!.permissions.get('posts')!.read).toBe(true)
  })

  it('throws error for unknown policy ID', () => {
    expect(() => defineDirectusRules<TestSchema>({
      roles: [{
        name: 'Editor',
        policies: [{ id: 'non-existent' }],
      }],
    })).toThrow('Policy with id "non-existent" not found')
  })

  it('allows mixing inline and referenced policies', () => {
    const rules = defineDirectusRules<TestSchema>({
      policies: [{ id: 'shared', name: 'Shared', permissions: {} }],
      roles: [{
        name: 'Editor',
        policies: [
          { id: 'shared' },
          { name: 'Inline', permissions: { posts: { read: true } } },
        ],
      }],
    })

    expect(rules.roles[0]!.policies).toHaveLength(2)
    expect(rules.roles[0]!.policies[0]!.name).toBe('Shared')
    expect(rules.roles[0]!.policies[1]!.name).toBe('Inline')
  })

  it('allows same policy to be referenced by multiple roles', () => {
    const rules = defineDirectusRules<TestSchema>({
      policies: [{
        id: 'read-posts',
        name: 'Read Posts',
        permissions: { posts: { read: '*' } },
      }],
      roles: [
        { name: 'Editor', policies: [{ id: 'read-posts' }] },
        { name: 'Viewer', policies: [{ id: 'read-posts' }] },
      ],
    })

    // Both roles should have the same policy
    expect(rules.roles[0]!.policies[0]!.name).toBe('Read Posts')
    expect(rules.roles[1]!.policies[0]!.name).toBe('Read Posts')
    // They should reference the same policy object
    expect(rules.roles[0]!.policies[0]).toBe(rules.roles[1]!.policies[0])
  })

  it('distinguishes policy reference from inline policy with id', () => {
    // A policy reference has only 'id', no 'name'
    // An inline policy with id has both 'id' and 'name'
    const rules = defineDirectusRules<TestSchema>({
      policies: [{
        id: 'standalone',
        name: 'Standalone',
        permissions: { posts: { read: true } },
      }],
      roles: [{
        name: 'Editor',
        policies: [
          { id: 'standalone' }, // Reference
          { id: 'inline-id', name: 'Inline With ID', permissions: {} }, // Inline with ID
        ],
      }],
    })

    expect(rules.roles[0]!.policies[0]!.name).toBe('Standalone')
    expect(rules.roles[0]!.policies[1]!.name).toBe('Inline With ID')
  })
})
