# Server-Side Utilities

nuxt-directus-sdk provides server-side utilities for authenticating Directus requests in Nuxt server routes. These utilities automatically handle session tokens and admin authentication.

## Overview

The module provides several server utilities:

- **`useServerDirectus(event)`** - Authenticated requests using user session
- **`useAdminDirectus()`** - Admin requests using admin token
- **`useTokenDirectus(token)`** - Custom token authentication
- **`getDirectusSessionToken(event)`** - Manual token extraction

## User Authentication

### `useServerDirectus(event)`

Use the current user's session token for authenticated requests:

```typescript
// server/api/profile.ts
export default defineEventHandler(async (event) => {
  const directus = useServerDirectus(event)

  // This request uses the user's session token
  const user = await directus.request(readMe())

  return { user }
})
```

This automatically:
1. Extracts the session token from cookies
2. Attaches it to Directus requests
3. Maintains the user's authentication context

### Complete Example

```typescript
// server/api/my-articles.ts
import { readItems } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  const directus = useServerDirectus(event)

  try {
    // Get current user
    const user = await directus.request(readMe())

    // Fetch user's articles
    const articles = await directus.request(readItems('articles', {
      filter: {
        author: { _eq: user.id }
      },
      sort: ['-date_created'],
      limit: 10,
    }))

    return {
      user,
      articles,
    }
  } catch (error) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized - Please log in',
    })
  }
})
```

## Admin Authentication

### `useAdminDirectus()`

Use the admin token for privileged operations:

```typescript
// server/api/admin/users.ts
import { readUsers } from '@directus/sdk'

export default defineEventHandler(async () => {
  const directus = useAdminDirectus()

  // Admin-level access to all users
  const users = await directus.request(readUsers({
    fields: ['id', 'email', 'first_name', 'last_name', 'role'],
  }))

  return { users }
})
```

Requirements:
- `DIRECTUS_ADMIN_TOKEN` must be set in `.env`
- Should only be used for server-side operations
- Never expose admin token to client

### Admin Operations

```typescript
// server/api/admin/create-user.ts
import { createUser } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  const directus = useAdminDirectus()
  const body = await readBody(event)

  // Create user with admin privileges
  const user = await directus.request(createUser({
    email: body.email,
    password: body.password,
    role: body.role,
  }))

  return { user }
})
```

## Custom Token Authentication

### `useTokenDirectus(token?)`

Use a custom token for authentication:

```typescript
// server/api/custom-auth.ts
export default defineEventHandler(async (event) => {
  // Get token from header
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'No token provided',
    })
  }

  const directus = useTokenDirectus(token)

  const user = await directus.request(readMe())

  return { user }
})
```

### API Key Authentication

```typescript
// server/api/webhook.ts
export default defineEventHandler(async (event) => {
  const apiKey = getHeader(event, 'X-API-Key')

  // Validate API key and get associated token
  const token = await validateApiKey(apiKey)

  const directus = useTokenDirectus(token)

  // Make authenticated request
  const items = await directus.request(readItems('webhooks'))

  return { items }
})
```

## Manual Token Extraction

### `getDirectusSessionToken(event)`

Extract the session token manually:

```typescript
// server/api/check-auth.ts
export default defineEventHandler((event) => {
  const token = getDirectusSessionToken(event)

  return {
    authenticated: !!token,
    token: token ? '***' : null, // Don't expose actual token
  }
})
```

Use case: Custom authentication logic

```typescript
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  const publicPaths = ['/api/public']

  if (publicPaths.some(path => event.path.startsWith(path))) {
    return
  }

  const token = getDirectusSessionToken(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }
})
```

## Advanced Examples

### Protected API Route

```typescript
// server/api/protected/data.ts
import { readItems } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  // Verify user is authenticated
  const token = getDirectusSessionToken(event)
  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const directus = useServerDirectus(event)

  // Get user data
  const user = await directus.request(readMe())

  // Check user role
  if (user.role.name !== 'Admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden - Admin access required',
    })
  }

  // Fetch sensitive data
  const data = await directus.request(readItems('sensitive_data'))

  return { data }
})
```

### Hybrid Authentication

Combine user and admin authentication:

```typescript
// server/api/analytics.ts
import { readItems } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  // Try user authentication first
  const userToken = getDirectusSessionToken(event)

  let directus
  let scope = 'public'

  if (userToken) {
    directus = useServerDirectus(event)
    const user = await directus.request(readMe())

    // Admins get full data
    if (user.role.name === 'Admin') {
      directus = useAdminDirectus()
      scope = 'admin'
    } else {
      scope = 'user'
    }
  } else {
    // Public users get limited data
    directus = useAdminDirectus() // Still need read access
    scope = 'public'
  }

  // Fetch data based on scope
  const filter = scope === 'public'
    ? { status: { _eq: 'published' } }
    : {}

  const analytics = await directus.request(readItems('analytics', {
    filter,
    limit: scope === 'admin' ? -1 : 10,
  }))

  return { scope, analytics }
})
```

### Batch Operations

```typescript
// server/api/batch/import.ts
import { createItems } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const directus = useAdminDirectus()

  // Batch create items
  const results = await directus.request(createItems('items', body.items))

  return {
    success: true,
    count: results.length,
    items: results,
  }
})
```

### File Upload Handler

```typescript
// server/api/upload.ts
import { uploadFiles } from '@directus/sdk'
import { readFiles } from 'h3'

export default defineEventHandler(async (event) => {
  const directus = useServerDirectus(event)

  // Read multipart form data
  const files = await readFiles(event)

  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No files provided',
    })
  }

  const formData = new FormData()

  files.forEach(file => {
    formData.append('file', file)
  })

  // Upload to Directus
  const uploaded = await directus.request(uploadFiles(formData))

  return { uploaded }
})
```

### Scheduled Task

```typescript
// server/tasks/sync.ts
import { readItems, updateItem } from '@directus/sdk'

export default defineTask({
  meta: {
    name: 'sync:data',
    description: 'Sync data with external API',
  },
  async run() {
    const directus = useAdminDirectus()

    // Fetch items to sync
    const items = await directus.request(readItems('sync_queue', {
      filter: { status: { _eq: 'pending' } },
      limit: 100,
    }))

    for (const item of items) {
      try {
        // Sync with external API
        await syncToExternalAPI(item)

        // Update status
        await directus.request(updateItem('sync_queue', item.id, {
          status: 'completed',
          synced_at: new Date(),
        }))
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error)
      }
    }

    return { synced: items.length }
  },
})
```

### Database Query Helper

```typescript
// server/utils/db.ts
import type { Query } from '@directus/sdk'

export async function fetchWithAuth<T>(
  event: H3Event,
  collection: string,
  query?: Query<DirectusSchema, any>
) {
  const directus = useServerDirectus(event)
  return directus.request(readItems(collection, query))
}

// Usage in route
// server/api/posts.ts
export default defineEventHandler(async (event) => {
  const posts = await fetchWithAuth(event, 'posts', {
    sort: ['-date_created'],
    limit: 20,
  })

  return { posts }
})
```

### Role-Based Access Control

```typescript
// server/utils/auth.ts
export async function requireRole(event: H3Event, requiredRole: string) {
  const directus = useServerDirectus(event)

  const user = await directus.request(readMe({
    fields: ['id', 'email', 'role.*'],
  }))

  if (user.role.name !== requiredRole) {
    throw createError({
      statusCode: 403,
      message: `Access denied - ${requiredRole} role required`,
    })
  }

  return user
}

// Usage
// server/api/admin/settings.ts
export default defineEventHandler(async (event) => {
  await requireRole(event, 'Admin')

  const directus = useAdminDirectus()
  const settings = await directus.request(readSingleton('settings'))

  return { settings }
})
```

## Configuration

### Admin Token Setup

Set your admin token in `.env`:

```env
DIRECTUS_ADMIN_TOKEN=your_admin_token_here
```

Get your admin token from Directus:
1. Go to Directus Admin → User Menu → Account
2. Copy your token under "Admin Access Token"

### Security Best Practices

1. **Never expose admin token to client**
   ```typescript
   // ❌ DON'T
   export default defineEventHandler(() => {
     return { adminToken: process.env.DIRECTUS_ADMIN_TOKEN }
   })

   // ✅ DO
   export default defineEventHandler(() => {
     const directus = useAdminDirectus()
     // Use admin token internally only
   })
   ```

2. **Always validate user input**
   ```typescript
   export default defineEventHandler(async (event) => {
     const body = await readBody(event)

     // Validate input
     if (!body.email || !isValidEmail(body.email)) {
       throw createError({ statusCode: 400, message: 'Invalid email' })
     }

     const directus = useServerDirectus(event)
     // Proceed with validated data
   })
   ```

3. **Use appropriate authentication level**
   ```typescript
   // User operations - use user session
   const directus = useServerDirectus(event)

   // Admin operations - use admin token
   const directus = useAdminDirectus()
   ```

## API Reference

### `useServerDirectus(event)`

Create a Directus client authenticated with the user's session token.

**Parameters:**
- `event: H3Event` - The Nuxt server event

**Returns:** `DirectusClient` - Authenticated Directus client

**Example:**
```typescript
const directus = useServerDirectus(event)
const user = await directus.request(readMe())
```

### `useAdminDirectus()`

Create a Directus client authenticated with the admin token.

**Returns:** `DirectusClient` - Admin-authenticated Directus client

**Throws:** Error if `DIRECTUS_ADMIN_TOKEN` is not set

**Example:**
```typescript
const directus = useAdminDirectus()
const users = await directus.request(readUsers())
```

### `useTokenDirectus(token?)`

Create a Directus client with a custom token.

**Parameters:**
- `token?: string` - Optional authentication token

**Returns:** `DirectusClient` - Token-authenticated Directus client

**Example:**
```typescript
const directus = useTokenDirectus('custom-token')
const items = await directus.request(readItems('items'))
```

### `getDirectusSessionToken(event)`

Extract the session token from cookies.

**Parameters:**
- `event: H3Event` - The Nuxt server event

**Returns:** `string | undefined` - The session token if present

**Example:**
```typescript
const token = getDirectusSessionToken(event)
if (token) {
  console.log('User is authenticated')
}
```

### `useDirectusUrl(path?)`

Get the full Directus URL for a given path.

**Parameters:**
- `path?: string` - Optional path to append

**Returns:** `string` - Full Directus URL

**Example:**
```typescript
const assetsUrl = useDirectusUrl('assets')
// Returns: https://your-directus.com/assets
```

## Troubleshooting

### Token Not Found

If `getDirectusSessionToken()` returns `undefined`:

1. Check that user is logged in on the frontend
2. Verify cookies are being sent with requests
3. Check cookie name is `directus_session_token`
4. Ensure `credentials: 'include'` is set in module config

### Admin Token Errors

If you get "DIRECTUS_ADMIN_TOKEN is not set":

1. Add `DIRECTUS_ADMIN_TOKEN` to your `.env` file
2. Restart your development server
3. Verify the token is valid in Directus

### Permission Errors

If you get permission errors:

1. Verify the user/token has appropriate permissions in Directus
2. Check collection access settings in Directus
3. Use `useAdminDirectus()` for privileged operations

## See Also

- [Authentication Guide](/guide/authentication)
- [Getting Started](/guide/getting-started)
- [Configuration Reference](/api/configuration)
- [Directus Server-Side Documentation](https://docs.directus.io/)
