import { describe, expect, it } from 'vitest'
import {
  compareRulesPayloads,
  formatDiff,
} from '../../src/rules'
import type {
  DirectusPermissionPayload,
  DirectusPolicyPayload,
  DirectusRolePayload,
  DirectusRulesPayload,
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
      const role: DirectusRolePayload = { name: 'Editor', icon: 'edit', description: null, parent: null }
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
        policies: [{
          name: 'Content',
          icon: 'article',
          description: null,
          ip_access: null,
          enforce_tfa: false,
          admin_access: false,
          app_access: true,
        }],
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
        policies: [{
          name: 'Content',
          icon: 'article',
          description: null,
          ip_access: null,
          enforce_tfa: true, // Changed
          admin_access: false,
          app_access: true,
        }],
        permissions: [],
      }
      const remote: DirectusRulesPayload = {
        roles: [],
        policies: [{
          id: 'policy-1',
          name: 'Content',
          icon: 'article',
          description: null,
          ip_access: null,
          enforce_tfa: false, // Original
          admin_access: false,
          app_access: true,
        }],
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
        permissions: [{
          policy: 'policy-1',
          collection: 'posts',
          action: 'read',
          permissions: null,
          validation: null,
          presets: null,
          fields: null,
        }],
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
        permissions: [{
          policy: 'policy-1',
          collection: 'posts',
          action: 'read',
          permissions: { status: { _eq: 'published' } },
          validation: null,
          presets: null,
          fields: ['title', 'content'],
        }],
      }
      const remote: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [{
          id: 1,
          policy: 'policy-1',
          collection: 'posts',
          action: 'read',
          permissions: null, // No filter originally
          validation: null,
          presets: null,
          fields: ['title'], // Fewer fields
        }],
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
          { policy: 'p1', collection: 'posts', action: 'read', permissions: null, validation: null, presets: null, fields: null },
          { policy: 'p1', collection: 'posts', action: 'create', permissions: null, validation: null, presets: null, fields: null },
          { policy: 'p2', collection: 'posts', action: 'read', permissions: null, validation: null, presets: null, fields: null },
        ],
      }
      const remote: DirectusRulesPayload = {
        roles: [],
        policies: [],
        permissions: [
          { id: 1, policy: 'p1', collection: 'posts', action: 'read', permissions: null, validation: null, presets: null, fields: null },
        ],
      }

      const diff = compareRulesPayloads(local, remote)

      expect(diff.summary.permissions.added).toBe(2)
      expect(diff.summary.permissions.unchanged).toBe(undefined) // not in summary
      expect(diff.permissions.filter(p => p.type === 'unchanged')).toHaveLength(1)
      expect(diff.permissions.filter(p => p.type === 'added')).toHaveLength(2)
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
          { name: 'Content', icon: 'article', description: null, ip_access: null, enforce_tfa: false, admin_access: false, app_access: true },
        ],
        permissions: [
          { policy: 'p1', collection: 'posts', action: 'read', permissions: null, validation: null, presets: null, fields: null },
        ],
      }
      const remote: DirectusRulesPayload = {
        roles: [
          { id: 'r1', name: 'Editor', icon: 'edit_old', description: null, parent: null }, // modified
          { id: 'r2', name: 'OldRole', icon: 'old', description: null, parent: null }, // removed
        ],
        policies: [
          { id: 'p1', name: 'Content', icon: 'article', description: null, ip_access: null, enforce_tfa: false, admin_access: false, app_access: true },
          { id: 'p2', name: 'Legacy', icon: 'legacy', description: null, ip_access: null, enforce_tfa: false, admin_access: false, app_access: true }, // removed
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
      policies: [{
        name: 'Content',
        icon: 'new_icon',
        description: 'Updated',
        ip_access: null,
        enforce_tfa: true,
        admin_access: false,
        app_access: true,
      }],
      permissions: [],
    }
    const remote: DirectusRulesPayload = {
      roles: [],
      policies: [{
        id: 'p1',
        name: 'Content',
        icon: 'old_icon',
        description: 'Original',
        ip_access: null,
        enforce_tfa: false,
        admin_access: false,
        app_access: true,
      }],
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
        { policy: 'p1', collection: 'posts', action: 'read', permissions: null, validation: null, presets: null, fields: null },
        { policy: 'p1', collection: 'posts', action: 'create', permissions: null, validation: null, presets: null, fields: null },
        { policy: 'p1', collection: 'users', action: 'read', permissions: null, validation: null, presets: null, fields: null },
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
