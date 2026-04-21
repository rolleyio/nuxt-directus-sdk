# Testing Rules

The rules framework includes a full testing API for verifying permissions in your test suite. Define your access control in code, then write tests to ensure it works as expected before pushing to Directus.

## Creating a Tester

```typescript
import { createRulesTester, defineDirectusRules } from 'nuxt-directus-sdk/rules'

const rules = defineDirectusRules<DirectusSchema>({
  roles: [
    {
      name: 'Admin',
      policies: [{ name: 'Full Access', adminAccess: true, permissions: {} }],
    },
    {
      name: 'Editor',
      policies: [
        {
          name: 'Content Management',
          permissions: {
            posts: {
              create: { fields: ['title', 'content'] },
              read: true,
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
          name: 'Read Only',
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
```

## Checking Permissions

Use `can()` to check if a role or policy allows an action:

```typescript
import { describe, expect, it } from 'vitest'

describe('Editor permissions', () => {
  it('can read and create posts', () => {
    expect(tester.can('Editor', 'read', 'posts').allowed).toBe(true)
    expect(tester.can('Editor', 'create', 'posts').allowed).toBe(true)
  })

  it('cannot delete users', () => {
    expect(tester.can('Editor', 'delete', 'users').allowed).toBe(false)
  })

  it('returns filter details for conditional access', () => {
    const result = tester.can('Editor', 'update', 'posts')
    expect(result.allowed).toBe(true)
    expect(result.permission?.filter).toEqual({
      author: { _eq: '$CURRENT_USER' },
    })
  })
})

describe('Admin permissions', () => {
  it('has admin access to everything', () => {
    const result = tester.can('Admin', 'delete', 'users')
    expect(result.allowed).toBe(true)
    expect(result.reason).toBe('Admin access granted')
  })
})
```

You can also look up by policy name instead of role name:

```typescript
expect(tester.can('Content Management', 'read', 'posts').allowed).toBe(true)
```

## Filter Matching

Test whether a specific item would pass the permission filter:

```typescript
describe('Editor filter matching', () => {
  it('can update own posts', () => {
    const post = { id: 1, title: 'My Post', content: '...', status: 'draft', author: 'user-123' }

    const matches = tester.itemMatchesFilter('Editor', 'update', 'posts', post, {
      currentUser: 'user-123',
    })

    expect(matches).toBe(true)
  })

  it('cannot update other users posts', () => {
    const post = { id: 2, title: 'Their Post', content: '...', status: 'draft', author: 'user-456' }

    const matches = tester.itemMatchesFilter('Editor', 'update', 'posts', post, {
      currentUser: 'user-123',
    })

    expect(matches).toBe(false)
  })

  it('can only delete own drafts', () => {
    const draft = { id: 1, title: 'Draft', content: '...', status: 'draft', author: 'user-123' }
    const published = { id: 2, title: 'Live', content: '...', status: 'published', author: 'user-123' }

    expect(tester.itemMatchesFilter('Editor', 'delete', 'posts', draft, {
      currentUser: 'user-123',
    })).toBe(true)

    expect(tester.itemMatchesFilter('Editor', 'delete', 'posts', published, {
      currentUser: 'user-123',
    })).toBe(false)
  })
})
```

The `context` parameter supports these dynamic variables:

| Variable | Context Key |
|----------|------------|
| `$CURRENT_USER` | `currentUser` |
| `$CURRENT_ROLE` | `currentRole` |
| `$CURRENT_ROLES` | `currentRoles` |
| `$NOW` | Current timestamp |

## Field-Level Access

Check which fields a role can access:

```typescript
describe('field access', () => {
  it('Editor can create with specific fields', () => {
    const fields = tester.getAccessibleFields('Editor', 'create', 'posts')
    expect(fields).toEqual(['title', 'content'])
  })

  it('Editor can read all fields', () => {
    const fields = tester.getAccessibleFields('Editor', 'read', 'posts')
    expect(fields).toBe('*')
  })

  it('Viewer can only read subset of fields', () => {
    const fields = tester.getAccessibleFields('Viewer', 'read', 'posts')
    expect(fields).toEqual(['id', 'title', 'status'])
  })

  it('check individual field access', () => {
    expect(tester.canAccessField('Editor', 'create', 'posts', 'title')).toBe(true)
    expect(tester.canAccessField('Editor', 'create', 'posts', 'status')).toBe(false)
  })
})
```

## Presets

Test default values applied when creating items:

```typescript
const rules = defineDirectusRules<DirectusSchema>({
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
              },
            },
          },
        },
      ],
    },
  ],
})

const tester = createRulesTester(rules)

it('applies draft status preset on create', () => {
  const presets = tester.getPresets('Editor', 'create', 'posts')
  expect(presets).toEqual({ status: 'draft' })
})

it('returns null when no presets configured', () => {
  expect(tester.getPresets('Editor', 'read', 'posts')).toBeNull()
})
```

## Validation Testing

Test validation rules against item data:

```typescript
import { allOf, pattern, required } from 'nuxt-directus-sdk/rules'

const rules = defineDirectusRules<DirectusSchema>({
  roles: [
    {
      name: 'Editor',
      policies: [
        {
          name: 'Posts',
          permissions: {
            posts: {
              create: {
                fields: ['title', 'slug'],
                validation: allOf(
                  required('title'),
                  pattern('slug', '^[a-z0-9-]+$'),
                ),
              },
            },
          },
        },
      ],
    },
  ],
})

const tester = createRulesTester(rules)

it('passes with valid data', async () => {
  const result = await tester.validateItem('Editor', 'create', 'posts', {
    title: 'My Post',
    slug: 'my-post',
  })
  expect(result.valid).toBe(true)
})

it('fails when title is missing', async () => {
  const result = await tester.validateItem('Editor', 'create', 'posts', {
    slug: 'my-post',
  })
  expect(result.valid).toBe(false)
  expect(result.issues[0].field).toBe('title')
})

it('fails with invalid slug', async () => {
  const result = await tester.validateItem('Editor', 'create', 'posts', {
    title: 'My Post',
    slug: 'Invalid Slug!',
  })
  expect(result.valid).toBe(false)
  expect(result.issues[0].field).toBe('slug')
})
```

## Custom Vitest Matchers

For a more expressive test API, use the custom matchers:

```typescript
import { createRulesMatchers, createRulesTester } from 'nuxt-directus-sdk/rules'

const tester = createRulesTester(rules)
const matchers = createRulesMatchers(tester)

expect.extend(matchers)
```

Add the type declarations to your `vitest.d.ts`:

```typescript
import type { RulesMatcherExtensions } from 'nuxt-directus-sdk/rules'
import 'vitest'

declare module 'vitest' {
  interface Assertion<T> extends RulesMatcherExtensions<T> {}
  interface AsymmetricMatchersContaining extends RulesMatcherExtensions<unknown> {}
}
```

Then use them in tests:

```typescript
expect('Editor').toAllowAction('read', 'posts')
expect('Editor').toRestrictAction('delete', 'users')
expect('Editor').toAllowFields('create', 'posts', ['title', 'content'])
expect('Editor').toRestrictFields('create', 'posts', ['status', 'author'])
expect('Admin').toHaveAdminAccess()
```

## Testing with Remote Rules

A common pattern is loading rules from Directus, extending them, and testing the result:

```typescript
import { readFileSync } from 'node:fs'
import {
  createAdminPolicy,
  createRulesTester,
  extendRules,
  loadRulesFromPayload,
} from 'nuxt-directus-sdk/rules'

// Load rules exported from Directus (via rules:pull CLI)
const payload = JSON.parse(readFileSync('rules.json', 'utf-8'))
const remoteRules = loadRulesFromPayload<DirectusSchema>(payload)

// Extend with your local additions
const rules = extendRules(remoteRules, {
  roles: [
    {
      name: 'Editor',
      policies: [
        {
          name: 'Content Management',
          permissions: {
            blogs: { read: true, create: true, update: true },
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

describe('remote rules', () => {
  it('public policy allows reading blogs', () => {
    expect(tester.can('$t:public_label', 'read', 'blogs').allowed).toBe(true)
  })
})

describe('local additions', () => {
  it('editor can manage blogs', () => {
    expect(tester.can('Editor', 'read', 'blogs').allowed).toBe(true)
    expect(tester.can('Editor', 'create', 'blogs').allowed).toBe(true)
  })

  it('admin has full access', () => {
    expect(tester.can('Admin', 'delete', 'blogs').allowed).toBe(true)
    expect(tester.can('Admin', 'read', 'blogs').reason).toBe('Admin access granted')
  })
})
```

## API Reference

### `createRulesTester(rules)`

Creates a tester instance with the following methods:

| Method | Returns | Description |
|--------|---------|-------------|
| `can(roleOrPolicy, action, collection)` | `PermissionTestResult` | Check if an action is allowed |
| `itemMatchesFilter(roleOrPolicy, action, collection, item, context?)` | `boolean` | Test item against permission filter |
| `getAccessibleFields(roleOrPolicy, action, collection)` | `string[] \| '*'` | Get allowed fields |
| `canAccessField(roleOrPolicy, action, collection, field)` | `boolean` | Check single field access |
| `getPresets(roleOrPolicy, action, collection)` | `object \| null` | Get default values |
| `validateItem(roleOrPolicy, action, collection, item)` | `Promise<ValidationTestResult>` | Validate item data |
| `getRules()` | `RulesConfig` | Get the underlying rules |

### `PermissionTestResult`

```typescript
interface PermissionTestResult {
  allowed: boolean
  permission?: PermissionConfig // Present when conditionally allowed
  reason?: string // Human-readable explanation
}
```

### `ValidationTestResult`

```typescript
interface ValidationTestResult {
  valid: boolean
  issues: Array<{
    field: string // Field that failed, or '*' for general errors
    message: string // Human-readable error
  }>
}
```
