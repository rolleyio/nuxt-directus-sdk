---
outline: [2,3]
---

# Composables

Complete API reference for all composables provided by nuxt-directus-sdk.

## TypeScript Support

All composables are fully typed with TypeScript:

```typescript
// User is typed as DirectusUsers
const { user } = useDirectusAuth()
user.value?.email // string | undefined
user.value?.first_name // string | undefined

// Directus client is typed with your schema
const directus = useDirectus()
const articles = await directus.request(readItems('articles'))
// articles is typed based on your Directus schema

// File options are typed
const url = getDirectusFileUrl(file, {
  fit: 'cover', // Only allows: 'cover' | 'contain' | 'inside' | 'outside'
  format: 'webp', // Only allows: 'jpg' | 'png' | 'webp' | 'tiff' | 'avif'
})
```

## Auto-Imported Directus SDK Functions

The module auto-imports every function exported by `@directus/sdk` — including any new ones added in future SDK releases — so you can call them directly without an `import` statement. The module reads the SDK's exports at build time, so whichever version of `@directus/sdk` you have installed, those functions are what you get.

**Usage:**

```typescript
const directus = useDirectus()

const articles = await directus.request(readItems('articles', {
  filter: { status: { _eq: 'published' } },
  fields: ['*', { author: ['*'] }],
  sort: ['-date_created'],
  limit: 10,
}))

const article = await directus.request(readItem('articles', 'id', {
  fields: ['*', { author: ['first_name', 'last_name'] }],
}))

const created = await directus.request(createItem('articles', {
  title: 'New Article',
  status: 'draft',
}))
```

### Functions excluded from auto-import

A small number of SDK functions are intentionally **not** auto-imported. Most are wrapped by this module's own composables — using them directly bypasses features like SSR cookie forwarding or devProxy handling, which typically isn't what you want. They can still be imported manually from `@directus/sdk` when you have a specific reason.

| Function | Why it's excluded |
| --- | --- |
| `createDirectus()` | Use [`useDirectus()`](#directus-client-composables) — returns a fully-configured singleton with auth, rest, realtime, and SSR cookie forwarding already attached. |
| `rest()` | Transport plugin; already attached by `useDirectus()`. |
| `realtime()` | Realtime/WebSocket plugin; already attached by `useDirectus()`. |
| `authentication()` | Auth plugin; already attached by `useDirectus()`. |
| `staticToken()` | Static-token auth plugin. The module uses this internally via the `adminToken` config for type generation and server-only tasks. If you need a one-off authenticated client (e.g. a server handler calling Directus with a service token), import it manually alongside `createDirectus()` and `rest()`. |
| `auth()` | Low-level auth handler. Use the auth composables ([`useDirectusAuth`](#authentication-composables), etc.) for normal login/logout/refresh flows. Import manually only if you're building a custom auth pipeline outside the module. |
| `getAuthEndpoint()` | Auth endpoint path helper (e.g. resolves the correct `/auth/login` route for a flow). Only useful if you're hand-rolling auth requests outside the module's composables — rare. |
| `memoryStorage()` | Storage primitive — use [`useDirectusStorage()`](#storage-composables) instead. |
| `graphql()` | This module does not wrap or support GraphQL. If you need it, import consciously so expectations are explicit. |
| `readGraphqlSdl()` | GraphQL-specific; kept as a manual import for the same reason. |

If you need one of these, import it directly:

```typescript
import { createDirectus, graphql, rest } from '@directus/sdk'
```

### Disabling or customising auto-imports

You can turn auto-imports off or narrow the list via the [`autoImportSdk`](/api/configuration/module#autoimportsdk) option in your Nuxt config.

**Disable entirely:**

```typescript
export default defineNuxtConfig({
  directus: {
    autoImportSdk: false,
  },
})
```

**Exclude specific functions** — useful if a name collides with something else in your app:

```typescript
export default defineNuxtConfig({
  directus: {
    autoImportSdk: {
      exclude: ['aggregate', 'customEndpoint'],
    },
  },
})
```

Your `exclude` is additive: the module's built-in exclusions still apply, and you don't need to repeat them.

## Authentication Composables
<!--@include: ./auth.md{7,}-->

## Directus Client Composables
<!--@include: ./client.md{7,}-->

## File Composables
<!--@include: ./file.md{7,}-->

## Storage Composables
<!--@include: ./storage.md{7,}-->

## See Also

- [Server-Side Utilities](/guide/server-side)
- [Configuration Reference](/api/configuration/)
- [Components Reference](/api/components/)
- [Directus SDK Documentation](https://docs.directus.io/reference/sdk.html)
