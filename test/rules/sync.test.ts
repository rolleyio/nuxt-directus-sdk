import type { DirectusRolePayload, DirectusRulesPayload, PushResult } from '../../src/rules'
import { describe, expect, it } from 'vitest'
import {
  compareRulesPayloads,
  formatDiff,
  formatPushResult,
  loadRulesFromPayload,
  serializeToDirectusApi,
} from '../../src/rules'

describe('sync: compareRulesPayloads', () => {
  describe('roles', () => {
    it('detects added roles', () => {
      const local: DirectusRulesPayload = {
        roles: [{ name: 'Editor', icon: 'edit', description: null, parent: null }],
        policies: [],
        permissions: [],
      }
      const remote: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.hasChanges).toBe(true)
      expect(diff.summary.roles.added).toBe(1)
      expect(diff.roles[0].type).toBe('added')
      expect(diff.roles[0].name).toBe('Editor')
      expect(diff.roles[0].local).toBeDefined()
      expect(diff.roles[0].remote).toBeUndefined()
    })

    it('detects removed roles', () => {
      const local: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [],
      }
      const remote: DirectusRulesPayload = {
        roles: [{ id: 'abc', name: 'Legacy', icon: 'old', description: null, parent: null }],
        policies: [],
        permissions: [],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.hasChanges).toBe(true)
      expect(diff.summary.roles.removed).toBe(1)
      expect(diff.roles[0].type).toBe('removed')
      expect(diff.roles[0].name).toBe('Legacy')
      expect(diff.roles[0].remote).toBeDefined()
      expect(diff.roles[0].local).toBeUndefined()
    })

    it('detects modified roles', () => {
      const local: DirectusRulesPayload = {
        roles: [{ name: 'Editor', icon: 'edit_new', description: 'Updated', parent: null }],
        policies: [],
        permissions: [],
      }
      const remote: DirectusRulesPayload = {
        roles: [{ id: 'abc', name: 'Editor', icon: 'edit', description: 'Original', parent: null }],
        policies: [],
        permissions: [],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.hasChanges).toBe(true)
      expect(diff.summary.roles.modified).toBe(1)
      expect(diff.roles[0].type).toBe('modified')
      expect(diff.roles[0].name).toBe('Editor')
      expect(diff.roles[0].local?.icon).toBe('edit_new')
      expect(diff.roles[0].remote?.icon).toBe('edit')
    })

    it('detects unchanged roles', () => {
      const role: DirectusRolePayload = {
        name: 'Editor',
        icon: 'edit',
        description: null,
        parent: null,
      }
      const local: DirectusRulesPayload = {
        roles: [role],
        policies: [],
        permissions: [],
      }
      const remote: DirectusRulesPayload = {
        roles: [{ ...role, id: 'abc' }],
        policies: [],
        permissions: [],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.hasChanges).toBe(false)
      expect(diff.roles[0].type).toBe('unchanged')
    })
  })

  describe('policies', () => {
    it('detects added policies', () => {
      const local: DirectusRulesPayload = {
        roles: [],
        policies: [
          {
            name: 'Content',
            icon: 'article',
            description: null,
            ip_access: null,
            enforce_tfa: false,
            admin_access: false,
            app_access: true,
          },
        ],
        permissions: [],
      }
      const remote: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.hasChanges).toBe(true)
      expect(diff.summary.policies.added).toBe(1)
      expect(diff.policies[0].type).toBe('added')
      expect(diff.policies[0].name).toBe('Content')
    })

    it('detects modified policies', () => {
      const local: DirectusRulesPayload = {
        roles: [],
        policies: [
          {
            name: 'Content',
            icon: 'article',
            description: null,
            ip_access: null,
            enforce_tfa: true, // Changed
            admin_access: false,
            app_access: true,
          },
        ],
        permissions: [],
      }
      const remote: DirectusRulesPayload = {
        roles: [],
        policies: [
          {
            id: 'policy-1',
            name: 'Content',
            icon: 'article',
            description: null,
            ip_access: null,
            enforce_tfa: false, // Original
            admin_access: false,
            app_access: true,
          },
        ],
        permissions: [],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.hasChanges).toBe(true)
      expect(diff.summary.policies.modified).toBe(1)
      expect(diff.policies[0].type).toBe('modified')
      expect(diff.policies[0].local?.enforce_tfa).toBe(true)
      expect(diff.policies[0].remote?.enforce_tfa).toBe(false)
    })
  })

  describe('permissions', () => {
    it('detects added permissions', () => {
      const local: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [
          {
            policy: 'policy-1',
            collection: 'posts',
            action: 'read',
            permissions: null,
            validation: null,
            presets: null,
            fields: null,
          },
        ],
      }
      const remote: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.hasChanges).toBe(true)
      expect(diff.summary.permissions.added).toBe(1)
      expect(diff.permissions[0].type).toBe('added')
      expect(diff.permissions[0].collection).toBe('posts')
      expect(diff.permissions[0].action).toBe('read')
    })

    it('detects modified permissions', () => {
      const local: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [
          {
            policy: 'policy-1',
            collection: 'posts',
            action: 'read',
            permissions: { status: { _eq: 'published' } },
            validation: null,
            presets: null,
            fields: ['title', 'content'],
          },
        ],
      }
      const remote: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [
          {
            id: 1,
            policy: 'policy-1',
            collection: 'posts',
            action: 'read',
            permissions: null, // No filter originally
            validation: null,
            presets: null,
            fields: ['title'], // Fewer fields
          },
        ],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.hasChanges).toBe(true)
      expect(diff.summary.permissions.modified).toBe(1)
      expect(diff.permissions[0].type).toBe('modified')
    })

    it('matches permissions by policy+collection+action composite key', () => {
      const local: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [
          {
            policy: 'p1',
            collection: 'posts',
            action: 'read',
            permissions: null,
            validation: null,
            presets: null,
            fields: null,
          },
          {
            policy: 'p1',
            collection: 'posts',
            action: 'create',
            permissions: null,
            validation: null,
            presets: null,
            fields: null,
          },
          {
            policy: 'p2',
            collection: 'posts',
            action: 'read',
            permissions: null,
            validation: null,
            presets: null,
            fields: null,
          },
        ],
      }
      const remote: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [
          {
            id: 1,
            policy: 'p1',
            collection: 'posts',
            action: 'read',
            permissions: null,
            validation: null,
            presets: null,
            fields: null,
          },
        ],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.summary.permissions.added).toBe(2)
      expect(diff.summary.permissions.unchanged).toBe(undefined) // not in summary
      expect(diff.permissions.filter((p) => p.type === 'unchanged')).toHaveLength(1)
      expect(diff.permissions.filter((p) => p.type === 'added')).toHaveLength(2)
    })
  })

  describe('complex scenarios', () => {
    it('handles empty payloads', () => {
      const empty: DirectusRulesPayload = { roles: [], policies: [], permissions: [] }

      const diff = compareRulesPayloads(empty, empty)

      expect(diff.hasChanges).toBe(false)
      expect(diff.summary.roles.added).toBe(0)
      expect(diff.summary.policies.added).toBe(0)
      expect(diff.summary.permissions.added).toBe(0)
    })

    it('handles mixed changes across all types', () => {
      const local: DirectusRulesPayload = {
        roles: [
          { name: 'Editor', icon: 'edit', description: null, parent: null },
          { name: 'NewRole', icon: 'new', description: null, parent: null },
        ],
        policies: [
          {
            name: 'Content',
            icon: 'article',
            description: null,
            ip_access: null,
            enforce_tfa: false,
            admin_access: false,
            app_access: true,
          },
        ],
        permissions: [
          {
            policy: 'p1',
            collection: 'posts',
            action: 'read',
            permissions: null,
            validation: null,
            presets: null,
            fields: null,
          },
        ],
      }
      const remote: DirectusRulesPayload = {
        roles: [
          { id: 'r1', name: 'Editor', icon: 'edit_old', description: null, parent: null }, // modified
          { id: 'r2', name: 'OldRole', icon: 'old', description: null, parent: null }, // removed
        ],
        policies: [
          {
            id: 'p1',
            name: 'Content',
            icon: 'article',
            description: null,
            ip_access: null,
            enforce_tfa: false,
            admin_access: false,
            app_access: true,
          },
          {
            id: 'p2',
            name: 'Legacy',
            icon: 'legacy',
            description: null,
            ip_access: null,
            enforce_tfa: false,
            admin_access: false,
            app_access: true,
          }, // removed
        ],
        permissions: [],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.hasChanges).toBe(true)
      expect(diff.summary.roles.added).toBe(1)
      expect(diff.summary.roles.modified).toBe(1)
      expect(diff.summary.roles.removed).toBe(1)
      expect(diff.summary.policies.removed).toBe(1)
      expect(diff.summary.permissions.added).toBe(1)
    })
  })
})

describe('sync: formatDiff', () => {
  it('formats empty diff correctly', () => {
    const diff = compareRulesPayloads(
      { roles: [], policies: [], permissions: [] },
      { roles: [], policies: [], permissions: [] },
    )

    const output = formatDiff(diff)

    expect(output).toContain('Rules Diff Summary')
    expect(output).toContain('No changes detected')
  })

  it('formats added items with + prefix', () => {
    const local: DirectusRulesPayload = {
      roles: [{ name: 'Editor', icon: 'edit', description: 'New role', parent: null }],
      policies: [],
      permissions: [],
    }
    const remote: DirectusRulesPayload = { roles: [], policies: [], permissions: [] }

    const diff = compareRulesPayloads(local, remote)
    const output = formatDiff(diff)

    expect(output).toContain('+ Role: Editor')
    expect(output).toContain('icon: edit')
    expect(output).toContain('description: New role')
  })

  it('formats removed items with - prefix', () => {
    const local: DirectusRulesPayload = { roles: [], policies: [], permissions: [] }
    const remote: DirectusRulesPayload = {
      roles: [{ id: 'r1', name: 'Legacy', icon: 'old', description: null, parent: null }],
      policies: [],
      permissions: [],
    }

    const diff = compareRulesPayloads(local, remote)
    const output = formatDiff(diff)

    expect(output).toContain('- Role: Legacy')
  })

  it('formats modified items with ~ prefix and field changes', () => {
    const local: DirectusRulesPayload = {
      roles: [],
      policies: [
        {
          name: 'Content',
          icon: 'new_icon',
          description: 'Updated',
          ip_access: null,
          enforce_tfa: true,
          admin_access: false,
          app_access: true,
        },
      ],
      permissions: [],
    }
    const remote: DirectusRulesPayload = {
      roles: [],
      policies: [
        {
          id: 'p1',
          name: 'Content',
          icon: 'old_icon',
          description: 'Original',
          ip_access: null,
          enforce_tfa: false,
          admin_access: false,
          app_access: true,
        },
      ],
      permissions: [],
    }

    const diff = compareRulesPayloads(local, remote)
    const output = formatDiff(diff)

    expect(output).toContain('~ Policy: Content')
    expect(output).toContain('icon:')
    expect(output).toContain('- old_icon')
    expect(output).toContain('+ new_icon')
  })

  it('includes summary counts', () => {
    const local: DirectusRulesPayload = {
      roles: [
        { name: 'New1', icon: 'a', description: null, parent: null },
        { name: 'New2', icon: 'b', description: null, parent: null },
      ],
      policies: [],
      permissions: [],
    }
    const remote: DirectusRulesPayload = { roles: [], policies: [], permissions: [] }

    const diff = compareRulesPayloads(local, remote)
    const output = formatDiff(diff)

    expect(output).toContain('Roles')
    expect(output).toContain('+2')
  })

  it('groups permissions by collection', () => {
    const local: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [
        {
          policy: 'p1',
          collection: 'posts',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
        {
          policy: 'p1',
          collection: 'posts',
          action: 'create',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
        {
          policy: 'p1',
          collection: 'users',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
      ],
    }
    const remote: DirectusRulesPayload = { roles: [], policies: [], permissions: [] }

    const diff = compareRulesPayloads(local, remote)
    const output = formatDiff(diff)

    expect(output).toContain('# posts')
    expect(output).toContain('# users')
    expect(output).toContain('+ posts.read')
    expect(output).toContain('+ posts.create')
    expect(output).toContain('+ users.read')
  })
})

describe('sync: system collection filtering', () => {
  it('excludes internal system collections by default', () => {
    const local: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [
        {
          policy: 'p1',
          collection: 'posts',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
      ],
    }
    const remote: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [
        {
          id: 1,
          policy: 'p1',
          collection: 'posts',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
        {
          id: 2,
          policy: 'p1',
          collection: 'directus_activity',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
        {
          id: 3,
          policy: 'p1',
          collection: 'directus_settings',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
        {
          id: 4,
          policy: 'p1',
          collection: 'directus_collections',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
      ],
    }

    const diff = compareRulesPayloads(local, remote)

    // Should not show directus_* as removed
    expect(diff.summary.permissions.removed).toBe(0)
    expect(diff.permissions.filter((p) => p.type === 'removed')).toHaveLength(0)
  })

  it('includes directus_users and directus_files (commonly extended)', () => {
    const local: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [
        {
          policy: 'p1',
          collection: 'directus_users',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: ['*'],
        },
        {
          policy: 'p1',
          collection: 'directus_files',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: ['*'],
        },
      ],
    }
    const remote: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [],
    }

    const diff = compareRulesPayloads(local, remote)

    // directus_users and directus_files should be included
    expect(diff.summary.permissions.added).toBe(2)
    expect(diff.permissions.filter((p) => p.collection === 'directus_users')).toHaveLength(1)
    expect(diff.permissions.filter((p) => p.collection === 'directus_files')).toHaveLength(1)
  })

  it('can include system collections with option', () => {
    const local: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [],
    }
    const remote: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [
        {
          id: 1,
          policy: 'p1',
          collection: 'directus_settings',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
      ],
    }

    const diff = compareRulesPayloads(local, remote, { excludeSystemCollections: false })

    // With option disabled, should show directus_settings as removed
    expect(diff.summary.permissions.removed).toBe(1)
    const removedPerm = diff.permissions.find((p) => p.type === 'removed')
    expect(removedPerm?.collection).toBe('directus_settings')
  })
})

describe('sync: null-policy permission filtering', () => {
  it('excludes permissions with policy: null (app access permissions)', () => {
    const local: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [
        {
          policy: 'p1',
          collection: 'posts',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
      ],
    }
    const remote: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [
        {
          id: 1,
          policy: 'p1',
          collection: 'posts',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
        // App access permissions with null policy should be ignored
        {
          id: 2,
          policy: null,
          collection: 'directus_users',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
        {
          id: 3,
          policy: null,
          collection: 'directus_collections',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
      ],
    }

    const diff = compareRulesPayloads(local, remote)

    // Null-policy permissions should not show as removed
    expect(diff.summary.permissions.removed).toBe(0)
    expect(
      diff.permissions.filter((p) => p.policyId === undefined && p.type === 'removed'),
    ).toHaveLength(0)
  })

  it('handles local permissions with null policy correctly', () => {
    const local: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [
        {
          policy: null,
          collection: 'posts',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        },
      ],
    }
    const remote: DirectusRulesPayload = {
      roles: [],
      policies: [],
      permissions: [],
    }

    const diff = compareRulesPayloads(local, remote)

    // Local null-policy permissions should also be filtered out
    expect(diff.summary.permissions.added).toBe(0)
  })
})

describe('sync: formatPushResult', () => {
  it('formats successful push result', () => {
    const result: PushResult = {
      success: true,
      roles: [
        { type: 'created', name: 'Editor', id: 'role-1' },
        { type: 'updated', name: 'Admin', id: 'role-2' },
      ],
      policies: [{ type: 'created', name: 'Content Policy', id: 'policy-1' }],
      permissions: [
        { type: 'created', name: 'posts.read' },
        { type: 'created', name: 'posts.create' },
        { type: 'deleted', name: 'legacy.read', id: '123' },
      ],
      summary: {
        roles: { created: 1, updated: 1, deleted: 0, errors: 0 },
        policies: { created: 1, updated: 0, deleted: 0, errors: 0 },
        permissions: { created: 2, updated: 0, deleted: 1, errors: 0 },
      },
      errors: [],
    }

    const output = formatPushResult(result)

    expect(output).toContain('Push Result')
    expect(output).toContain('SUCCESS')
    expect(output).toContain('Roles')
    expect(output).toContain('+1')
    expect(output).toContain('~1')
    expect(output).toContain('Policies')
    expect(output).toContain('Perms')
    expect(output).toContain('-1')
  })

  it('formats failed push result with errors', () => {
    const result: PushResult = {
      success: false,
      roles: [{ type: 'skipped', name: 'Editor', error: 'Permission denied' }],
      policies: [],
      permissions: [],
      summary: {
        roles: { created: 0, updated: 0, deleted: 0, errors: 1 },
        policies: { created: 0, updated: 0, deleted: 0, errors: 0 },
        permissions: { created: 0, updated: 0, deleted: 0, errors: 0 },
      },
      errors: ['Failed to create role "Editor": Permission denied'],
    }

    const output = formatPushResult(result)

    expect(output).toContain('FAILED')
    expect(output).toContain('Errors:')
    expect(output).toContain('Permission denied')
    expect(output).toContain('1 errors')
  })

  it('formats empty push result (no changes)', () => {
    const result: PushResult = {
      success: true,
      roles: [],
      policies: [],
      permissions: [],
      summary: {
        roles: { created: 0, updated: 0, deleted: 0, errors: 0 },
        policies: { created: 0, updated: 0, deleted: 0, errors: 0 },
        permissions: { created: 0, updated: 0, deleted: 0, errors: 0 },
      },
      errors: [],
    }

    const output = formatPushResult(result)

    expect(output).toContain('SUCCESS')
    expect(output).toContain('+0')
    expect(output).toContain('~0')
    expect(output).toContain('-0')
    expect(output).not.toContain('Errors:')
  })
})

describe('sync: loadRulesFromPayload preserves original policy IDs', () => {
  it('preserves _originalPolicyIds when policies cannot be resolved', () => {
    // Payload with a role that references policies by ID that don't exist in the payload
    const payload: DirectusRulesPayload = {
      roles: [
        {
          id: 'role-1',
          name: 'Editor',
          icon: 'edit',
          description: null,
          parent: null,
          policies: ['policy-uuid-1', 'policy-uuid-2'], // IDs that won't resolve
        },
      ],
      policies: [], // No policies to resolve to
      permissions: [],
    }

    const rules = loadRulesFromPayload(payload)

    // Role should have _originalPolicyIds preserved
    const role = rules.roles[0]
    expect(role).toBeDefined()
    expect(role!._originalPolicyIds).toEqual(['policy-uuid-1', 'policy-uuid-2'])
    expect(role!.policies).toHaveLength(0) // No resolved policies
  })

  it('uses _originalPolicyIds during serialization when policies not resolved', () => {
    const payload: DirectusRulesPayload = {
      roles: [
        {
          id: 'role-1',
          name: 'Editor',
          icon: 'edit',
          description: null,
          parent: null,
          policies: ['policy-uuid-1'],
        },
      ],
      policies: [],
      permissions: [],
    }

    const rules = loadRulesFromPayload(payload)
    const serialized = serializeToDirectusApi(rules)

    // Serialized role should have the original policy IDs
    const serializedRole = serialized.roles[0]
    expect(serializedRole).toBeDefined()
    expect(serializedRole!.policies).toEqual(['policy-uuid-1'])
  })

  it('does not show role as modified when policy IDs are preserved', () => {
    // Simulates the "Server role appearing as modified" bug fix
    const remotePayload: DirectusRulesPayload = {
      roles: [
        {
          id: 'server-role-id',
          name: 'Server',
          icon: 'dns',
          description: 'For server-side operations',
          parent: null,
          policies: ['admin-policy-id'],
        },
      ],
      policies: [
        {
          id: 'admin-policy-id',
          name: '$t:admin_policy',
          icon: 'verified',
          description: '$t:admin_policy_description',
          ip_access: null,
          enforce_tfa: false,
          admin_access: true,
          app_access: true,
        },
      ],
      permissions: [],
    }

    // Load and re-serialize (simulating what happens during diff)
    const rules = loadRulesFromPayload(remotePayload)
    const serialized = serializeToDirectusApi(rules)

    // Compare the serialized version with original
    const diff = compareRulesPayloads(serialized, remotePayload)

    // Server role should NOT appear as modified
    const serverRole = diff.roles.find((r) => r.name === 'Server')
    expect(serverRole?.type).toBe('unchanged')
  })
})

describe('sync: round-trip payload consistency', () => {
  it('load and serialize produces equivalent payload', () => {
    const original: DirectusRulesPayload = {
      roles: [
        {
          id: 'role-1',
          name: 'Editor',
          icon: 'edit',
          description: 'Content editor',
          parent: null,
          policies: ['policy-1'],
        },
      ],
      policies: [
        {
          id: 'policy-1',
          name: 'Content Policy',
          icon: 'article',
          description: 'Manage content',
          ip_access: null,
          enforce_tfa: false,
          admin_access: false,
          app_access: true,
        },
      ],
      permissions: [
        {
          id: 1,
          policy: 'policy-1',
          collection: 'posts',
          action: 'read',
          permissions: { status: { _eq: 'published' } },
          validation: null,
          presets: null,
          fields: ['title', 'content'],
        },
      ],
    }

    const rules = loadRulesFromPayload(original)
    const serialized = serializeToDirectusApi(rules)
    const diff = compareRulesPayloads(serialized, original)

    // Should have no changes after round-trip
    expect(diff.hasChanges).toBe(false)
  })
})
