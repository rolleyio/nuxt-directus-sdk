import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  compareRulesPayloads,
  createAdminPolicy,
  createRulesTester,
  extendRules,
  loadRulesFromPayload,
  serializeToDirectusApi,
} from '../../src/rules'

const payload = JSON.parse(readFileSync('./test/rules/fixtures/rules.json', 'utf-8'))
const remoteRules = loadRulesFromPayload<DirectusSchema>(payload)

// Extend the sandbox rules with additional local-only roles and policies.
// Role/policy names are chosen to not conflict with sandbox names
// (Administrator, Writer, Editor, Content Admin).
const rules = extendRules(remoteRules, {
  policies: [
    {
      name: 'Post Editor Policy',
      permissions: {
        posts: { read: true, create: true, update: true },
      },
    },
  ],
  roles: [
    {
      name: 'Local Content Editor',
      policies: [
        {
          name: 'Local Content Management',
          permissions: {
            posts: { read: true, create: true, update: true },
            pages: { read: true },
          },
        },
      ],
    },
    {
      name: 'Local Admin',
      policies: [createAdminPolicy('Full Access')],
    },
  ],
})

const tester = createRulesTester(rules)

describe('remote rules (from directus sandbox)', () => {
  it('public policy allows reading posts', () => {
    expect(tester.can('$t:public_label', 'read', 'posts').allowed).toBe(true)
  })

  it('public policy allows reading pages', () => {
    expect(tester.can('$t:public_label', 'read', 'pages').allowed).toBe(true)
  })

  it('public policy does not allow creating posts', () => {
    expect(tester.can('$t:public_label', 'create', 'posts').allowed).toBe(false)
  })

  it('sandbox Writer role can create posts (Content - Self policy)', () => {
    expect(tester.can('Writer', 'create', 'posts').allowed).toBe(true)
  })

  it('sandbox Editor role can read and update all posts (Content - Manage policy)', () => {
    expect(tester.can('Editor', 'read', 'posts').allowed).toBe(true)
    expect(tester.can('Editor', 'update', 'posts').allowed).toBe(true)
  })

  it('sandbox Content Admin role has full content access', () => {
    expect(tester.can('Content Admin', 'read', 'posts').allowed).toBe(true)
    expect(tester.can('Content Admin', 'update', 'posts').allowed).toBe(true)
    expect(tester.can('Content Admin', 'delete', 'posts').allowed).toBe(true)
  })
})

describe('extended rules (local additions)', () => {
  it('local content editor role can read and create posts', () => {
    expect(tester.can('Local Content Editor', 'read', 'posts').allowed).toBe(true)
    expect(tester.can('Local Content Editor', 'create', 'posts').allowed).toBe(true)
  })

  it('local content editor role can read pages', () => {
    expect(tester.can('Local Content Editor', 'read', 'pages').allowed).toBe(true)
  })

  it('local admin role has full access via adminAccess', () => {
    const result = tester.can('Local Admin', 'read', 'posts')
    expect(result.allowed).toBe(true)
    expect(result.reason).toBe('Admin access granted')
  })

  it('local admin role can do anything', () => {
    expect(tester.can('Local Admin', 'delete', 'posts').allowed).toBe(true)
    expect(tester.can('Local Admin', 'create', 'pages').allowed).toBe(true)
  })

  it('standalone policy can be tested directly', () => {
    expect(tester.can('Post Editor Policy', 'read', 'posts').allowed).toBe(true)
    expect(tester.can('Post Editor Policy', 'create', 'posts').allowed).toBe(true)
  })
})

describe('diff functionality', () => {
  it('shows diff between remote and extended rules', () => {
    const localPayload = serializeToDirectusApi(rules)
    const diff = compareRulesPayloads(localPayload, payload)
    expect(diff.hasChanges).toBe(true)
    expect(diff.summary.roles.added).toBeGreaterThan(0)
    expect(diff.summary.policies.added).toBeGreaterThan(0)
  })

  it('serializes extended rules for CLI diff', () => {
    const localPayload = serializeToDirectusApi(rules)
    expect(localPayload.roles).toBeDefined()
    expect(localPayload.policies).toBeDefined()
    expect(localPayload.permissions).toBeDefined()
  })
})
