# Composables Reference

Complete API reference for all composables provided by nuxt-directus-sdk.

## Authentication Composables

### `useDirectusAuth()`

Main authentication composable with methods and state for user authentication.

**Returns:** `DirectusAuth`

```typescript
interface DirectusAuth {
  user: Ref<DirectusUsers | null>
  loggedIn: ComputedRef<boolean>
  readMe: () => Promise<DirectusUsers | null>
  updateMe: (data: Partial<DirectusUsers>) => Promise<DirectusUsers | null>
  login: (email: string, password: string, options?) => Promise<DirectusUsers | null>
  loginWithProvider: (provider: string, redirectOnLogin?: string) => Promise<void>
  logout: (redirect?: boolean | RouteLocationRaw) => Promise<void>
  createUser: (data: Partial<DirectusUsers>) => Promise<DirectusUsers>
  register: (data: Partial<DirectusUsers>) => Promise<DirectusUsers>
  inviteUser: (email: string, role: string, inviteUrl?: string) => Promise<void>
  acceptUserInvite: (token: string, password: string) => Promise<void>
  passwordRequest: (email: string, resetUrl?: string) => Promise<void>
  passwordReset: (token: string, password: string) => Promise<void>
}
```

**Example:**

```typescript
const {
  user,
  loggedIn,
  login,
  logout,
  readMe,
  updateMe,
} = useDirectusAuth()

// Login
await login('user@example.com', 'password')

// Check if logged in
if (loggedIn.value) {
  console.log('Logged in as:', user.value.email)
}

// Update user
await updateMe({ first_name: 'John' })

// Logout
await logout()
```

#### Properties

##### `user`

- **Type:** `Ref<DirectusUsers | null>`
- **Description:** Current authenticated user

```typescript
const { user } = useDirectusAuth()

console.log(user.value?.email)
console.log(user.value?.first_name)
console.log(user.value?.role)
```

##### `loggedIn`

- **Type:** `ComputedRef<boolean>`
- **Description:** Whether a user is currently logged in

```typescript
const { loggedIn } = useDirectusAuth()

if (loggedIn.value) {
  console.log('User is authenticated')
}
```

#### Methods

##### `readMe()`

Fetch the current user's data.

**Returns:** `Promise<DirectusUsers | null>`

```typescript
const { readMe } = useDirectusAuth()

const user = await readMe()
```

##### `updateMe(data)`

Update the current user's profile.

**Parameters:**
- `data: Partial<DirectusUsers>` - Fields to update

**Returns:** `Promise<DirectusUsers | null>`

```typescript
const { updateMe } = useDirectusAuth()

await updateMe({
  first_name: 'John',
  last_name: 'Doe',
  avatar: 'file-uuid',
})
```

##### `login(email, password, options?)`

Login with email and password.

**Parameters:**
- `email: string` - User email
- `password: string` - User password
- `options?: LoginOptions & { redirect?: boolean | RouteLocationRaw }` - Login options

**Returns:** `Promise<DirectusUsers | null>`

```typescript
const { login } = useDirectusAuth()

// Login with redirect (default)
await login('user@example.com', 'password')

// Login without redirect
await login('user@example.com', 'password', { redirect: false })

// Login with custom redirect
await login('user@example.com', 'password', { redirect: '/dashboard' })

// Login with OTP
await login('user@example.com', 'password', { otp: '123456' })
```

##### `loginWithProvider(provider, redirectOnLogin?)`

Login with SSO/OAuth provider.

**Parameters:**
- `provider: string` - Provider name (google, github, microsoft, etc.)
- `redirectOnLogin?: string` - URL to redirect to after login

**Returns:** `Promise<void>`

```typescript
const { loginWithProvider } = useDirectusAuth()

// Login with Google
await loginWithProvider('google')

// Login with custom redirect
await loginWithProvider('google', '/dashboard')
```

##### `logout(redirect?)`

Logout the current user.

**Parameters:**
- `redirect?: boolean | RouteLocationRaw` - Where to redirect after logout

**Returns:** `Promise<void>`

```typescript
const { logout } = useDirectusAuth()

// Logout with default redirect
await logout()

// Logout without redirect
await logout(false)

// Logout with custom redirect
await logout('/login')
```

##### `createUser(data)` / `register(data)`

Create a new user account. `register()` is an alias for `createUser()`.

**Parameters:**
- `data: Partial<DirectusUsers>` - User data

**Returns:** `Promise<DirectusUsers>`

```typescript
const { register } = useDirectusAuth()

const newUser = await register({
  email: 'new@example.com',
  password: 'secure-password',
  first_name: 'John',
  last_name: 'Doe',
})
```

##### `inviteUser(email, role, inviteUrl?)`

Invite a new user.

**Parameters:**
- `email: string` - User email
- `role: string` - Role ID or UUID
- `inviteUrl?: string` - Custom invite URL

**Returns:** `Promise<void>`

```typescript
const { inviteUser } = useDirectusAuth()

await inviteUser(
  'newuser@example.com',
  'role-uuid',
  'https://yourapp.com/accept-invite'
)
```

##### `acceptUserInvite(token, password)`

Accept a user invitation.

**Parameters:**
- `token: string` - Invite token
- `password: string` - New password

**Returns:** `Promise<void>`

```typescript
const { acceptUserInvite } = useDirectusAuth()

await acceptUserInvite('invite-token', 'new-password')
```

##### `passwordRequest(email, resetUrl?)`

Request a password reset.

**Parameters:**
- `email: string` - User email
- `resetUrl?: string` - Custom reset URL

**Returns:** `Promise<void>`

```typescript
const { passwordRequest } = useDirectusAuth()

await passwordRequest(
  'user@example.com',
  'https://yourapp.com/reset-password'
)
```

##### `passwordReset(token, password)`

Reset password with token.

**Parameters:**
- `token: string` - Reset token
- `password: string` - New password

**Returns:** `Promise<void>`

```typescript
const { passwordReset } = useDirectusAuth()

await passwordReset('reset-token', 'new-password')
```

---

### `useDirectusUser()`

Direct access to the current user state.

**Returns:** `Ref<DirectusUsers | null>`

```typescript
const user = useDirectusUser()

console.log(user.value?.email)
console.log(user.value?.first_name)

// Watch for changes
watch(user, (newUser) => {
  if (newUser) {
    console.log('User logged in:', newUser.email)
  } else {
    console.log('User logged out')
  }
})
```

## Directus Client Composables

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
const { data } = await useAsyncData('articles', () =>
  directus.request(readItems('articles', {
    filter: { status: { _eq: 'published' } },
    sort: ['-date_created'],
    limit: 10,
  }))
)
```

**Common Operations:**

```typescript
import {
  readItems,
  readItem,
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
  readSingleton,
  updateSingleton,
} from '@directus/sdk'

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

Generate full URLs to your Directus instance.

**Parameters:**
- `path?: string` - Optional path to append

**Returns:** `string`

```typescript
const directusUrl = useDirectusUrl()
// Returns: https://your-directus.com

const apiUrl = useDirectusUrl('items/articles')
// Returns: https://your-directus.com/items/articles

const assetsUrl = useDirectusUrl('assets')
// Returns: https://your-directus.com/assets

const adminUrl = useDirectusUrl('admin')
// Returns: https://your-directus.com/admin
```

---

### `useDirectusPreview()`

Control and check visual editor preview mode.

**Returns:** `Ref<boolean>`

```typescript
const directusPreview = useDirectusPreview()

// Enable preview mode
directusPreview.value = true

// Disable preview mode
directusPreview.value = false

// Check if preview mode is active
if (directusPreview.value) {
  console.log('Preview mode is enabled')
}

// Use in templates
<template>
  <div v-if="directusPreview">
    Preview Mode Active
  </div>
</template>
```

**Common Usage:**

```vue
<script setup>
const route = useRoute()
const directusPreview = useDirectusPreview()

// Enable preview mode with ?preview=true
if (route.query.preview === 'true') {
  directusPreview.value = true
}
</script>

<template>
  <DirectusVisualEditor
    v-if="directusPreview"
    collection="articles"
    :item="article.id"
  >
    <h1>{{ article.title }}</h1>
  </DirectusVisualEditor>

  <h1 v-else>{{ article.title }}</h1>
</template>
```

## File Composables

### `uploadDirectusFile(file, query?)`

Upload a single file to Directus.

**Parameters:**
- `file: { file: File, data?: Partial<DirectusFiles> }` - File and metadata
- `query?: Query` - Directus query options

**Returns:** `Promise<DirectusFiles>`

```typescript
import { uploadDirectusFile } from '#imports'

const file = event.target.files[0]

const uploaded = await uploadDirectusFile({
  file,
  data: {
    title: 'My Image',
    description: 'Image description',
    folder: 'folder-uuid',
  }
}, {
  fields: ['*'],
})

console.log('Uploaded:', uploaded.id)
```

---

### `uploadDirectusFiles(files, query?)`

Upload multiple files to Directus.

**Parameters:**
- `files: Array<{ file: File, data?: Partial<DirectusFiles> }>` - Files and metadata
- `query?: Query` - Directus query options

**Returns:** `Promise<DirectusFiles[]>`

```typescript
import { uploadDirectusFiles } from '#imports'

const files = Array.from(event.target.files).map(file => ({
  file,
  data: {
    folder: 'folder-uuid',
  }
}))

const uploaded = await uploadDirectusFiles(files)

console.log('Uploaded files:', uploaded.length)
```

---

### `getDirectusFileUrl(file, options?)`

Generate a URL for a Directus file with optional transformations.

**Parameters:**
- `file: string | DirectusFiles` - File ID or file object
- `options?: DirectusFileOptions` - Transformation options

**Returns:** `string`

```typescript
import { getDirectusFileUrl } from '#imports'

// Basic URL
const url = getDirectusFileUrl('file-uuid')

// With transformations
const url = getDirectusFileUrl('file-uuid', {
  width: 800,
  height: 600,
  quality: 80,
  fit: 'cover',
  format: 'webp',
})

// From file object
const file = await directus.request(readFile('file-uuid'))
const url = getDirectusFileUrl(file, { width: 400 })

// Download link
const downloadUrl = getDirectusFileUrl(file, {
  download: true,
  filename: 'custom-name.jpg',
})
```

**Options:**

```typescript
interface DirectusFileOptions {
  filename?: string              // Custom filename for downloads
  download?: boolean             // Force download
  width?: number                 // Resize width
  height?: number                // Resize height
  quality?: number               // Image quality (1-100)
  fit?: 'cover' | 'contain' | 'inside' | 'outside'
  format?: 'jpg' | 'png' | 'webp' | 'tiff' | 'avif'
  withoutEnlargement?: boolean   // Prevent upscaling
  key?: string                   // Access key for private files
}
```

**Examples:**

```typescript
// Responsive image sizes
const thumbnail = getDirectusFileUrl(file, { width: 200, format: 'webp' })
const medium = getDirectusFileUrl(file, { width: 800, format: 'webp' })
const large = getDirectusFileUrl(file, { width: 1600, format: 'webp' })

// High-quality cover image
const cover = getDirectusFileUrl(file, {
  width: 1920,
  height: 1080,
  fit: 'cover',
  quality: 90,
  format: 'webp',
})

// Optimized thumbnail
const thumb = getDirectusFileUrl(file, {
  width: 300,
  height: 300,
  fit: 'cover',
  quality: 70,
  format: 'webp',
  withoutEnlargement: true,
})
```

## Storage Composables

### `useDirectusStorage()`

Get the Directus client storage instance (primarily for internal use).

**Returns:** `DirectusStorage`

```typescript
const storage = useDirectusStorage()

// Get item
const token = await storage.get('directus_session_token')

// Set item
await storage.set('directus_session_token', 'token-value')

// Delete item
await storage.delete('directus_session_token')
```

**Note:** This composable is mainly used internally for session management. You typically won't need to use it directly.

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
// No import needed - auto-imported
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

## See Also

- [Server-Side Utilities](/guide/server-side)
- [Configuration Reference](/api/configuration)
- [Components Reference](/api/components)
- [Directus SDK Documentation](https://docs.directus.io/reference/sdk.html)
