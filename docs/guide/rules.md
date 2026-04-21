# Rules DSL

The Rules DSL lets you define Directus roles, policies, and permissions as code. Instead of configuring access control through the Directus UI and hoping it stays in sync, you define it in TypeScript, test it, and push it to any Directus instance.

## Quick Start

```typescript
import { defineDirectusRules } from 'nuxt-directus-sdk/rules'

const rules = defineDirectusRules<DirectusSchema>({
  roles: [
    {
      name: 'Editor',
      policies: [
        {
          name: 'Content Management',
          permissions: {
            posts: {
              create: { fields: ['title', 'content'], presets: { status: 'draft' } },
              read: true,
              update: {
                fields: ['title', 'content', 'status'],
                filter: { author: { _eq: '$CURRENT_USER' } },
              },
              delete: { filter: { status: { _eq: 'draft' } } },
            },
            categories: { read: true },
          },
        },
      ],
    },
    {
      name: 'Admin',
      policies: [{ name: 'Full Access', adminAccess: true, permissions: {} }],
    },
  ],
})
```

## Permission Shorthand

Each collection action accepts several formats:

| Value | Meaning |
|-------|---------|
| `true` | Full access to all fields |
| `false` | Deny access |
| `'*'` | Same as `true` |
| `{ fields, filter, presets, validation }` | Conditional access |

```typescript
const permissions = {
  // Full read access
  posts: { read: true },

  // Specific fields only
  users: { read: { fields: ['name', 'email', 'avatar'] } },

  // Filtered access
  comments: {
    read: { filter: { status: { _eq: 'published' } } },
    update: {
      fields: ['content'],
      filter: { author: { _eq: '$CURRENT_USER' } },
    },
  },

  // Presets applied on create
  articles: {
    create: {
      fields: ['title', 'body'],
      presets: { status: 'draft', author: '$CURRENT_USER' },
    },
  },
}
```

## Admin Policies

For full admin access, use the `adminAccess` flag or the helper:

```typescript
import { createAdminPolicy } from 'nuxt-directus-sdk/rules'

// Inline
const rules = defineDirectusRules<DirectusSchema>({
  roles: [
    {
      name: 'Admin',
      policies: [{ name: 'Full Access', adminAccess: true, permissions: {} }],
    },
  ],
})

// Or with the helper
const rules = defineDirectusRules<DirectusSchema>({
  roles: [
    {
      name: 'Admin',
      policies: [createAdminPolicy('Full Access')],
    },
  ],
})
```

## Extending Rules

Load existing rules from a Directus instance (or JSON file) and extend them with local additions:

```typescript
import {
  createAdminPolicy,
  extendRules,
  loadRulesFromPayload,
} from 'nuxt-directus-sdk/rules'

// Load remote rules (e.g. pulled from Directus)
const payload = JSON.parse(readFileSync('rules.json', 'utf-8'))
const remoteRules = loadRulesFromPayload<DirectusSchema>(payload)

// Add local roles and policies
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
```

You can also merge multiple rule sets:

```typescript
import { mergeRules } from 'nuxt-directus-sdk/rules'

const combined = mergeRules(baseRules, teamARules, teamBRules)
```

## Validation

Attach validation rules to permissions using Directus filter syntax or standard schema libraries (Zod, Valibot, Arktype):

```typescript
import { allOf, field, pattern, required } from 'nuxt-directus-sdk/rules'

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
                fields: ['title', 'content', 'slug'],
                validation: allOf(
                  required('title'),
                  required('content'),
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
```

### Standard Schema Support

You can use Zod, Valibot, or Arktype schemas directly:

```typescript
import { z } from 'zod'

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
                validation: z.object({
                  title: z.string().min(1).max(200),
                  content: z.string().min(10),
                }),
              },
            },
          },
        },
      ],
    },
  ],
})
```

## Loading Rules

Rules can be loaded from several sources:

```typescript
import {
  loadRulesFromJson,
  loadRulesFromJsonFile,
  loadRulesFromPayload,
  loadRulesFromPayloadFile,
} from 'nuxt-directus-sdk/rules'

// From a JSON string or object
const rules = loadRulesFromJson<DirectusSchema>(jsonString)

// From a JSON file
const rules = loadRulesFromJsonFile<DirectusSchema>('rules.json')

// From a Directus API payload object
const rules = loadRulesFromPayload<DirectusSchema>(payload)

// From a Directus API payload file
const rules = loadRulesFromPayloadFile<DirectusSchema>('payload.json')
```

## Serialization

Convert rules back to formats Directus understands:

```typescript
import { serializeToDirectusApi, serializeToJson } from 'nuxt-directus-sdk/rules'

// To Directus API format (roles, policies, permissions arrays)
const payload = serializeToDirectusApi(rules)

// To a normalized JSON string
const json = serializeToJson(rules, true) // true = pretty-print
```
