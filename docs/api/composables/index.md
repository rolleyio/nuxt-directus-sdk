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

A small number of SDK functions are intentionally not auto-imported — either because this module provides a composable wrapper, or because the function is an internal SDK detail. All of them can still be imported manually from `@directus/sdk` when you have a specific reason.

| Category | Function | Use instead |
| --- | --- | --- |
| Client setup | `createDirectus()` | Use [`useDirectus()`](#directus-client-composables) — pre-configured with `auth()`, `rest()`, `realtime()`, and SSR cookie forwarding. |
| Client setup | `authentication()` | Already configured by `useDirectus()`. |
| Client setup | `rest()` | Already configured by `useDirectus()`. |
| Client setup | `realtime()` | Already configured by `useDirectus()`. |
| Client setup | `staticToken()` | Used internally for `adminToken`. Import manually if you need a one-off static-token client alongside `createDirectus()`. |
| Auth | `auth()` | Low-level realtime auth handler. Use [`useDirectusAuth()`](#authentication-composables) for normal flows. |
| Auth | `getAuthEndpoint()` | Internal SDK auth routing helper. |
| Auth | `acceptUserInvite()` | Use [`useDirectusAuth().acceptUserInvite()`](#authentication-composables). |
| Auth | `createUser()` | Use [`useDirectusAuth().createUser()`](#authentication-composables). |
| Auth | `inviteUser()` | Use [`useDirectusAuth().inviteUser()`](#authentication-composables). |
| Auth | `passwordRequest()` | Use [`useDirectusAuth().passwordRequest()`](#authentication-composables). |
| Auth | `passwordReset()` | Use [`useDirectusAuth().passwordReset()`](#authentication-composables). |
| Auth | `readMe()` | Use [`useDirectusAuth().readMe()`](#authentication-composables) — manages shared user state. |
| Auth | `updateMe()` | Use [`useDirectusAuth().updateMe()`](#authentication-composables) — manages shared user state. |
| Files | `uploadFiles()` | Use [`uploadDirectusFiles()`](#file-composables) — handles `FormData` construction. |
| Storage | `memoryStorage()` | Use [`useDirectusStorage()`](#storage-composables). |
| GraphQL | `graphql()` | Not supported by this module. Import manually if needed. |
| GraphQL | `readGraphqlSdl()` | Not supported by this module. Import manually if needed. |

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
- [Visual Editor Guide](/guide/visual-editor)
- [Directus SDK Documentation](https://docs.directus.io/reference/sdk.html)
