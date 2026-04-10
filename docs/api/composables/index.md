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

```typescript
// Items
readItems, readItem, createItem, createItems,
updateItem, updateItems, deleteItem, deleteItems

// Singletons
readSingleton, updateSingleton

// Files
readFile, readFiles, updateFile, updateFiles,
deleteFile, deleteFiles, uploadFiles

// Users
readUser, readUsers, createUser, createUsers,
updateUser, updateUsers, deleteUser, deleteUsers,
readMe, updateMe

// Collections
readCollection, readCollections, createCollection,
updateCollection, deleteCollection

// Fields
readField, readFields, readFieldsByCollection,
createField, updateField, deleteField

// Folders
readFolder, readFolders, updateFolder, updateFolders

// Comments
createComment, updateComment, deleteComment

// Activities
readActivity, readActivities

// Auth
readProviders

// Utilities
aggregate, generateUid, withToken, importFile
```

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
- [Configuration Reference](/api/configuration)
- [Components Reference](/api/components)
- [Directus SDK Documentation](https://docs.directus.io/reference/sdk.html)
