import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  compareRulesPayloads,
  createAdminPolicy,
  createRulesTester,
  extendRules,
  formatDiff,
  loadRulesFromPayload,
  serializeToDirectusApi,
} from '../../src/rules'

// Load rules pulled from Directus
const payload = JSON.parse(readFileSync('./test/rules/fixtures/rules.json', 'utf-8'))
const remoteRules = loadRulesFromPayload <DirectusSchema> (payload)

// Extend with additional policies and roles
const rules = extendRules(remoteRules, {
  policies: [
    {
      name: 'Blog Editor',
      permissions: {
        blogs: { read: true, create: true, update: true },
      },
    },
  ],
  roles: [
    {
      name: 'Editor',
      policies: [
        {
          name: 'Content Management',
          permissions: {
            blogs: { read: true, create: true, update: true },
            case_studies: { read: true },
          },
        },
      ],
    },
    {
      name: 'Admin',
      policies: [createAdminPolicy('Full Access')],
    },
  ],
})

const tester = createRulesTester(rules)

describe('remote rules (from directus)', () => {
  it('public policy allows reading blogs', () => {
    expect(tester.can('$t:public_label', 'read', 'blogs').allowed).toBe(true)
  })

  it('public policy allows reading case studies', () => {
    expect(tester.can('$t:public_label', 'read', 'case_studies').allowed).toBe(true)
  })

  it('public policy does not allow creating blogs', () => {
    expect(tester.can('$t:public_label', 'create', 'blogs').allowed).toBe(false)
  })
})

describe('extended rules (local additions)', () => {
  it('editor role can read and create blogs', () => {
    expect(tester.can('Editor', 'read', 'blogs').allowed).toBe(true)
    expect(tester.can('Editor', 'create', 'blogs').allowed).toBe(true)
  })

  it('editor role can read case studies', () => {
    expect(tester.can('Editor', 'read', 'case_studies').allowed).toBe(true)
  })

  it('admin role has full access via adminAccess', () => {
    const result = tester.can('Admin', 'read', 'blogs')
    expect(result.allowed).toBe(true)
    expect(result.reason).toBe('Admin access granted')
  })

  it('admin role can do anything', () => {
    expect(tester.can('Admin', 'delete', 'blogs').allowed).toBe(true)
    expect(tester.can('Admin', 'create', 'case_studies').allowed).toBe(true)
  })

  it('standalone policy can be tested directly', () => {
    expect(tester.can('Blog Editor', 'read', 'blogs').allowed).toBe(true)
    expect(tester.can('Blog Editor', 'create', 'blogs').allowed).toBe(true)
  })
})

describe('diff functionality', () => {
  it('shows diff between remote and extended rules', () => {
    // Serialize our extended rules to the Directus API format
    const localPayload = serializeToDirectusApi(rules)

    // Compare with the original remote payload
    const diff = compareRulesPayloads(localPayload, payload)

    // Print the diff
    // eslint-disable-next-line no-console
    console.log(`\n${formatDiff(diff)}`)

    // We added new roles and policies, so there should be changes
    expect(diff.hasChanges).toBe(true)
    expect(diff.summary.roles.added).toBeGreaterThan(0)
    expect(diff.summary.policies.added).toBeGreaterThan(0)
  })

  it('serializes extended rules for CLI diff', () => {
    const localPayload = serializeToDirectusApi(rules)

    // Verify the payload is valid JSON that could be written to a file
    expect(localPayload.roles).toBeDefined()
    expect(localPayload.policies).toBeDefined()
    expect(localPayload.permissions).toBeDefined()
  })
})
