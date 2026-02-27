import { describe, expect, it } from 'vitest'
import { createRulesTester, loadRulesFromJson, rulesToJson } from '../../src/rules'

// Test schema type
interface TestSchema {
  posts: {
    id: number
    title: string
    content: string
    status: 'draft' | 'published'
    author: string
  }
  categories: {
    id: number
    name: string
  }
}

describe('loadRulesFromJson', () => {
  it('loads rules from JSON object', () => {
    const json = {
      roles: [
        {
          name: 'Editor',
          icon: 'edit',
          description: 'Content editors',
          policies: [
            {
              name: 'PostAccess',
              permissions: {
                posts: {
                  create: { fields: ['title', 'content'] },
                  read: true,
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
    }

    const rules = loadRulesFromJson<TestSchema>(json)

    expect(rules.roles).toHaveLength(1)
    expect(rules.roles[0]!.name).toBe('Editor')
    expect(rules.roles[0]!.icon).toBe('edit')
    expect(rules.roles[0]!.policies).toHaveLength(1)

    const policy = rules.roles[0]!.policies[0]!
    expect(policy.name).toBe('PostAccess')

    const postsPerms = policy.permissions.get('posts')
    expect(postsPerms).toBeDefined()
    expect(postsPerms!.create).toEqual({ fields: ['title', 'content'] })
    expect(postsPerms!.read).toBe(true)
    expect(postsPerms!.update).toEqual({
      fields: ['title', 'content'],
      filter: { author: { _eq: '$CURRENT_USER' } },
    })
  })

  it('loads rules from JSON string', () => {
    const jsonString = JSON.stringify({
      roles: [
        {
          name: 'Viewer',
          policies: [
            {
              name: 'ReadOnly',
              permissions: {
                posts: { read: true },
              },
            },
          ],
        },
      ],
    })

    const rules = loadRulesFromJson<TestSchema>(jsonString)

    expect(rules.roles).toHaveLength(1)
    expect(rules.roles[0]!.name).toBe('Viewer')
  })

  it('loads standalone policies', () => {
    const json = {
      policies: [
        {
          name: 'PublicRead',
          permissions: {
            posts: { read: { filter: { status: { _eq: 'published' } } } },
          },
        },
      ],
    }

    const rules = loadRulesFromJson<TestSchema>(json)

    expect(rules.policies).toHaveLength(1)
    expect(rules.policies[0]!.name).toBe('PublicRead')
  })

  it('handles empty rules', () => {
    const rules = loadRulesFromJson<TestSchema>({})

    expect(rules.roles).toEqual([])
    expect(rules.policies).toEqual([])
  })

  it('handles all policy options', () => {
    const json = {
      roles: [
        {
          name: 'Admin',
          policies: [
            {
              name: 'AdminPolicy',
              icon: 'admin_panel_settings',
              description: 'Full admin access',
              ipAccess: ['192.168.1.0/24'],
              enforceTfa: true,
              adminAccess: true,
              appAccess: true,
              permissions: {},
            },
          ],
        },
      ],
    }

    const rules = loadRulesFromJson<TestSchema>(json)
    const policy = rules.roles[0]!.policies[0]!

    expect(policy.icon).toBe('admin_panel_settings')
    expect(policy.description).toBe('Full admin access')
    expect(policy.ipAccess).toEqual(['192.168.1.0/24'])
    expect(policy.enforceTfa).toBe(true)
    expect(policy.adminAccess).toBe(true)
    expect(policy.appAccess).toBe(true)
  })

  it('handles permission presets and validation', () => {
    const json = {
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
                    presets: { status: 'draft' },
                    validation: { title: { _nnull: true } },
                  },
                },
              },
            },
          ],
        },
      ],
    }

    const rules = loadRulesFromJson<TestSchema>(json)
    const createPerm = rules.roles[0]!.policies[0]!.permissions.get('posts')!.create

    expect(createPerm).toEqual({
      fields: ['title', 'content'],
      presets: { status: 'draft' },
      validation: { title: { _nnull: true } },
    })
  })

  it('loaded rules work with tester', () => {
    const json = {
      roles: [
        {
          name: 'Editor',
          policies: [
            {
              name: 'Posts',
              permissions: {
                posts: {
                  create: true,
                  read: true,
                  update: { filter: { author: { _eq: '$CURRENT_USER' } } },
                },
              },
            },
          ],
        },
      ],
    }

    const rules = loadRulesFromJson<TestSchema>(json)
    const tester = createRulesTester(rules)

    expect(tester.can('Editor', 'create', 'posts').allowed).toBe(true)
    expect(tester.can('Editor', 'delete', 'posts').allowed).toBe(false)

    const item = {
      id: 1,
      title: 'Test',
      content: 'Content',
      status: 'draft' as const,
      author: 'user-123',
    }
    expect(
      tester.itemMatchesFilter('Editor', 'update', 'posts', item, { currentUser: 'user-123' }),
    ).toBe(true)
    expect(
      tester.itemMatchesFilter('Editor', 'update', 'posts', item, { currentUser: 'user-456' }),
    ).toBe(false)
  })
})

describe('rulesToJson', () => {
  it('converts rules back to JSON format', () => {
    const originalJson = {
      roles: [
        {
          name: 'Editor',
          policies: [
            {
              name: 'Posts',
              permissions: {
                posts: { create: true, read: true },
              },
            },
          ],
        },
      ],
    }

    const rules = loadRulesFromJson<TestSchema>(originalJson)
    const json = rulesToJson(rules)

    expect(json.roles).toHaveLength(1)
    expect(json.roles![0]!.name).toBe('Editor')
    expect(json.roles![0]!.policies[0]!.permissions.posts.create).toBe(true)
    expect(json.roles![0]!.policies[0]!.permissions.posts.read).toBe(true)
  })

  it('handles complex permission configs', () => {
    const originalJson = {
      roles: [
        {
          name: 'Editor',
          policies: [
            {
              name: 'Posts',
              permissions: {
                posts: {
                  update: {
                    fields: ['title', 'content'],
                    filter: { author: { _eq: '$CURRENT_USER' } },
                    presets: { status: 'review' },
                  },
                },
              },
            },
          ],
        },
      ],
    }

    const rules = loadRulesFromJson<TestSchema>(originalJson)
    const json = rulesToJson(rules)

    const updatePerm = json.roles![0]!.policies[0]!.permissions.posts.update

    expect(updatePerm).toEqual({
      fields: ['title', 'content'],
      filter: { author: { _eq: '$CURRENT_USER' } },
      presets: { status: 'review' },
    })
  })

  it('roundtrips correctly', () => {
    const originalJson = {
      roles: [
        {
          id: 'role-1',
          name: 'Editor',
          icon: 'edit',
          description: 'Content editors',
          policies: [
            {
              id: 'policy-1',
              name: 'Posts',
              icon: 'article',
              description: 'Post management',
              adminAccess: false,
              appAccess: true,
              permissions: {
                posts: {
                  create: { fields: ['title', 'content'] },
                  read: true,
                  update: true,
                  delete: false,
                },
              },
            },
          ],
        },
      ],
      policies: [
        {
          name: 'PublicRead',
          permissions: {
            posts: { read: { filter: { status: { _eq: 'published' } } } },
          },
        },
      ],
    }

    const rules = loadRulesFromJson<TestSchema>(originalJson)
    const json = rulesToJson(rules)

    // Re-load and compare
    const reloaded = loadRulesFromJson<TestSchema>(json)

    expect(reloaded.roles).toHaveLength(1)
    expect(reloaded.roles[0]!.name).toBe('Editor')
    expect(reloaded.roles[0]!.id).toBe('role-1')

    expect(reloaded.policies).toHaveLength(1)
    expect(reloaded.policies[0]!.name).toBe('PublicRead')
  })
})
