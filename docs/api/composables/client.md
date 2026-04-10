---
outline: deep
---

# Client Composables

### `useDirectus()`

Get the Directus client instance for making API requests.

**Returns:** `DirectusClient<DirectusSchema>`

```typescript
const directus = useDirectus()

// Read items
const articles = await directus.request(readItems('articles'))

// Create item
const newArticle = await directus.request(createItem('articles', {
  title: 'New Article',
  content: 'Article content...',
}))

// Update item
await directus.request(updateItem('articles', 'item-id', {
  title: 'Updated Title',
}))

// Delete item
await directus.request(deleteItem('articles', 'item-id'))

// Read singleton
const settings = await directus.request(readSingleton('settings'))

// Custom queries
const { data: articles } = await useAsyncData('articles', () =>
  directus.request(readItems('articles', {
    filter: { status: { _eq: 'published' } },
    sort: ['-date_created'],
    limit: 10,
  })))
```

**Common Operations:**

```typescript
const directus = useDirectus()

// Collections
const items = await directus.request(readItems('collection'))
const item = await directus.request(readItem('collection', 'id'))
const created = await directus.request(createItem('collection', data))
const updated = await directus.request(updateItem('collection', 'id', data))
await directus.request(deleteItem('collection', 'id'))

// Singletons
const singleton = await directus.request(readSingleton('settings'))
await directus.request(updateSingleton('settings', data))
```

---

### `useDirectusUrl(path?)`

Generate full URLs to your Directus instance. This composable is context-aware:

- **Client**: returns the client URL (or proxy path if `devProxy` is enabled)
- **Server (SSR)**: returns the server URL if configured (for Docker/K8s internal networking), otherwise the client URL
- **Dev proxy**: returns `window.location.origin + proxyPath` on client, or host header-based URL on server

**Parameters:**
- `path?: string` - Optional path to append

**Returns:** `string`

```typescript
const directusUrl = useDirectusUrl()
// Client: https://cms.example.com
// Server (with split URL): http://directus:8055

const apiUrl = useDirectusUrl('items/articles')
// Client: https://cms.example.com/items/articles

const assetsUrl = useDirectusUrl('assets')
// Client: https://cms.example.com/assets
```

---

### `useDirectusOriginUrl(path?)`

Generate URLs to the **public-facing** Directus instance. Unlike `useDirectusUrl`, this always returns the client URL — it ignores both `devProxy` and `serverDirectusUrl`.

Use this when you need the real Directus URL for browser navigation (e.g. SSO redirects, admin links).

**Parameters:**
- `path?: string` - Optional path to append

**Returns:** `string`

```typescript
const ssoUrl = useDirectusOriginUrl('/auth/login/google?redirect=...')
// Always: https://cms.example.com/auth/login/google?redirect=...

const adminUrl = useDirectusOriginUrl('admin')
// Always: https://cms.example.com/admin
```

---

### `useDirectusPreview()`

Control and check preview mode. Preview mode is typically used to show draft/unpublished content when viewing your site with a `?preview=true` query parameter.

**Returns:** `Ref<boolean>`

```typescript
const directusPreview = useDirectusPreview()

// Check if preview mode is active
if (directusPreview.value) {
  console.log('Preview mode is enabled')
}
```

**Note:** Preview mode is separate from visual editor mode. Preview mode is set automatically by the plugin when `?preview=true` is in the URL. Visual editor mode is set automatically when the site is inside a Directus iframe.

```vue
<script setup>
const directusPreview = useDirectusPreview()
</script>

<template>
  <div v-if="directusPreview" class="preview-banner">
    Preview Mode — Showing draft content
  </div>
</template>
```

---

### `useDirectusVisualEditor()`

Check if the visual editor is active (i.e., your site is loaded inside a Directus iframe).

**Returns:** `Ref<boolean>`

This composable is set automatically by the Directus plugin — you do not need to set it manually. When `visualEditor: true` is in your config and the site is inside an iframe, this will be `true`.

```typescript
const directusVisualEditor = useDirectusVisualEditor()

if (directusVisualEditor.value) {
  console.log('Inside Directus iframe — editing enabled')
}
```

**Common Usage:**

```vue
<script setup>
const directusVisualEditor = useDirectusVisualEditor()
</script>

<template>
  <div v-if="directusVisualEditor" class="editor-banner">
    Editing Mode Active
  </div>
</template>
```
