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

The module auto-imports commonly used Directus SDK functions:

|Category|AutoImported Functions|
|---|---|
| <Badge>Items</Badge> | `createItem()`, `createItems()`, `readItem()`, `readItems()`, `updateItem()`, `updateItems()`, `deleteItem()`, `deleteItems()` |
| <Badge>Singletons</Badge> | `readSingleton()`, `updateSingleton()` |
| <Badge>Files</Badge> | `uploadFiles()`, `readFile()`, `readFiles()`, `updateFile()`, `updateFiles()`, `deleteFile()`, `deleteFiles()` |
| <Badge>Users</Badge> | `createUser()`, `createUsers()`, `readMe()`, `readUser()`, `readUsers()`, `updateMe()`, `updateUser()`, `updateUsers()`, `deleteUser()`, `deleteUsers()` |
| <Badge>Collections</Badge> | `createCollection()`, `readCollection()`, `readCollections()`, `updateCollection()`, `deleteCollection()` |
| <Badge>Fields</Badge> | `createField()`, `readField()`, `readFields()`, `readFieldsByCollection()`, `updateField()`, `deleteField()` |
| <Badge>Folders</Badge> | `readFolder()`, `readFolders()`, `updateFolder()`, `updateFolders()` |
| <Badge>Comments</Badge> | `createComment()`, `readComment()`, `updateComment()`, `deleteComment()` |
| <Badge>Activities</Badge> | `readActivity()`, `readActivities()` |
| <Badge>Auth</Badge> | `readProviders()` |
| <Badge>Utilities</Badge> | `aggregate()`, `generateUid()`, `importFile()`, `withToken()` |

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
