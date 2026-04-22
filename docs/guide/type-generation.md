# Type Generation

The module generates TypeScript types from your Directus schema at build time, so your app code is fully typed against real collections and fields.

## Quick start

Type generation is enabled by default. Set `DIRECTUS_ADMIN_TOKEN` in your `.env`:

```dotenv
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_ADMIN_TOKEN=your_admin_token
```

...and the module does the rest:

```typescript
// nuxt.config.ts — zero config needed
export default defineNuxtConfig({
  modules: ['nuxt-directus-sdk'],
})
```

When you run `nuxi dev` or `nuxi build`, the module fetches your Directus schema and writes a `.d.ts` file into `#build/types/directus.d.ts`. Nuxt picks it up automatically.

::: tip No admin token?
Type generation is a dev/build-time operation. You only need an admin token in the environment where you run `nuxi dev` / `nuxi build` / CI, not in production runtime. If you don't set one, type generation is skipped and a minimal fallback shape is used.
:::

## What gets generated

For a Directus instance with collections `posts`, `pages`, and the standard system collections, you get:

```typescript
// Interface per collection
interface Post {
  id: number
  title: string
  author: DirectusUser | string
  // ...every field on the collection
}

interface Page {
  id: number
  title: string
  // ...
}

// The schema used by the Directus SDK
interface DirectusSchema {
  posts: Post[]
  pages: Page[]
  directus_users: DirectusUser[]
  // ...every collection
}

// An enum of every collection name, for autocomplete
enum CollectionNames {
  posts = 'posts',
  pages = 'pages',
  directus_users = 'directus_users',
  // ...
}
```

Every `@directus/sdk` call in your app is typed against `DirectusSchema`, so `readItems('posts', ...)` knows the return shape and `readItems('notACollection')` is a type error.

## Type prefix

If your custom collection names collide with TypeScript globals or other types in your app (for example, you have a `Page` interface elsewhere), add a prefix:

```typescript
export default defineNuxtConfig({
  directus: {
    types: {
      prefix: 'App', // Prefix custom collection types
    },
  },
})
```

With `prefix: 'App'`, your generated types become:

```typescript
interface AppPost {
  id: number
  title: string
}

interface AppPage {
  id: number
  title: string
}

interface DirectusSchema {
  posts: AppPost[]
  pages: AppPage[]
}

// Directus system collections are NOT prefixed
interface DirectusUser {
  id: string
  email: string
}
```

**How it works:**

- Custom collection interface names get prefixed (`Post` becomes `AppPost`)
- `DirectusSchema` keys stay unchanged (they match the API endpoints)
- Directus system collections (`DirectusUser`, `DirectusFile`, etc.) are never prefixed
- All internal type references update to use the prefixed names

## Disabling

Set `types: false` to skip generation:

```typescript
export default defineNuxtConfig({
  directus: {
    types: false,
  },
})
```

You'll still get a minimal fallback shape that covers the SDK's core needs (a `DirectusSchema` stub, `DirectusFile`, `DirectusUser`), so your code compiles; it just won't be typed against your real schema.

## Generating types outside a Nuxt build

A standalone CLI lets you generate types on demand, without a running Nuxt instance. Useful for CI, pre-commit hooks, and non-Nuxt consumers.

```bash
npx nuxt-directus-sdk generate-types --prefix App -o types/directus.d.ts
```

See the [`generate-types` CLI reference](/cli/generate-types) for every flag and example.

## Advanced: filtering collections <Badge type="warning" text="advanced" />

For most apps you won't need anything below this line. The defaults emit every collection in your Directus schema, which is what you want unless the generated `.d.ts` is getting unwieldy.

If your instance has collections your app never touches (for example, `directus_activity`, `directus_revisions`) and you want to trim the generated types, or you have a large instance and want to limit types to a specific subset, two options let you do that:

- **`exclude`** — drop specific collections (deny-list).
- **`include`** — emit only specific collections (allow-list). Takes precedence over `exclude` if both are set (a warning is logged).

### Exclude

Drop the listed collections:

```typescript
export default defineNuxtConfig({
  directus: {
    types: {
      prefix: 'App',
      exclude: ['directus_activity', 'directus_revisions'],
    },
  },
})
```

### Include

Emit only the listed collections plus anything they reference. References are followed transitively, so you typically only need to list the collections your app code directly interacts with:

```typescript
export default defineNuxtConfig({
  directus: {
    types: {
      prefix: 'App',
      include: ['posts', 'pages'],
      // expandReferences defaults to true, pulls in directus_users, directus_files, etc.
    },
  },
})
```

Disable expansion with `expandReferences: false` if you want a strict allow-list where references to collections not in the list collapse to `string`:

```typescript
export default defineNuxtConfig({
  directus: {
    types: {
      prefix: 'App',
      include: ['posts'],
      expandReferences: false, // strict — posts.author becomes string, not DirectusUser | string
    },
  },
})
```

When expansion is on and collections are pulled in, a log line reports the delta:

```
 - Expanded include from 2 → 7 collections (+5 via references)
```

### How missing references are handled

When a field on an emitted collection references a missing collection (not in the include list and not pulled in by expansion, or explicitly excluded), the generator rewrites the reference so the emitted types stay resolvable:

- **M2O** references (for example `user_created: DirectusUser | string`) collapse to `string`
- **O2M** references (for example `revisions: DirectusRevision[] | string[]`) collapse to `string[]`
- **M2A** (polymorphic) references filter out missing collections from the union; if the whole union becomes empty, the field type collapses to `string`

After generation, a summary log line reports how many fields were rewritten and why:

```
 - 14 field references across 3 targets collapsed to string (excluded)
```

### Verbose logging

Enable `verbose: true` to see each rewritten target grouped and listed (capped at 5 fields per collection):

```typescript
export default defineNuxtConfig({
  directus: {
    types: {
      prefix: 'App',
      exclude: ['directus_users'],
      verbose: true,
    },
  },
})
```

Produces:

```
 - 92 field references across 1 target collapsed to string (excluded)
   · directus_users (excluded) — referenced by 92 fields across 45 collections
     posts.user_created, posts.user_updated, pages.user_created, pages.user_updated, blocks.user_created, …and 87 more
```

### When to use each

- **`exclude`** is most common. Keeps most of your types, drops a handful of collections you don't care about (`directus_activity`, `directus_revisions`, `directus_sessions`). Smaller `.d.ts`, faster TypeScript compile.
- **`include`** is for when you have a large Directus instance but your app touches only a narrow subset. More restrictive but produces the smallest possible `.d.ts`.

The same options are available on the CLI. See the [`generate-types` CLI reference](/cli/generate-types#filtering-collections) for flag-level usage.

## See also

- [Module options: `types`](/api/configuration/module#types)
- [CLI reference: `generate-types`](/cli/generate-types)
