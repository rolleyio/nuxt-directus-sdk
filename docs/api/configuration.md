# Configuration Reference

Complete reference for all nuxt-directus-sdk configuration options.

## Module Options

Configure the module in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-directus-sdk'],

  directus: {
    // Configuration options here
  },
})
```

## Core Options

### `url`

- **Type:** `string`
- **Required:** Yes
- **Default:** `process.env.DIRECTUS_URL`
- **Environment Variable:** `DIRECTUS_URL`

Your Directus instance URL.

```typescript
export default defineNuxtConfig({
  directus: {
    url: 'https://your-directus-instance.com',
  },
})
```

Or use environment variable:

```env
DIRECTUS_URL=https://your-directus-instance.com
```

### `adminToken`

- **Type:** `string`
- **Required:** No (required for type generation and admin operations)
- **Default:** `process.env.DIRECTUS_ADMIN_TOKEN`
- **Environment Variable:** `DIRECTUS_ADMIN_TOKEN`

Admin token for privileged operations and type generation.

```typescript
export default defineNuxtConfig({
  directus: {
  },
})
```

Or use environment variable:

```env
DIRECTUS_ADMIN_TOKEN=your-admin-token-here
```

**Security Note:** Never commit admin tokens to version control. Always use environment variables.

## Development Options

### `devProxy`

- **Type:** `boolean | { enabled?: boolean, path?: string }`
- **Default:** `{ enabled: true, path: '/directus' }` in dev mode
- **Default:** `false` in production

Development proxy configuration. When enabled, creates a proxy that forwards requests to your Directus instance, eliminating CORS issues.

```typescript
export default defineNuxtConfig({
  directus: {
    // Simple boolean
    devProxy: true,

    // Or detailed configuration
    devProxy: {
      enabled: true,
      path: '/directus', // Proxy mount path
    },
  },
})
```

**How it works:**
- In development: Requests to `http://localhost:3000/directus` forward to your Directus URL
- In production: Direct connection to Directus URL
- WebSocket proxy available at `${path}-ws` for realtime features

**Disable proxy:**
```typescript
export default defineNuxtConfig({
  directus: {
    devProxy: false, // Use direct connection in dev
  },
})
```

### `devtools`

- **Type:** `boolean`
- **Default:** `true`

Add Directus admin panel to Nuxt Devtools.

```typescript
export default defineNuxtConfig({
  directus: {
    devtools: true, // Enable Directus tab in devtools
  },
})
```

When enabled, you can access the Directus admin panel directly from Nuxt Devtools.

### `visualEditor`

- **Type:** `boolean`
- **Default:** `true`

Enable visual editor capabilities for live preview and inline editing.

```typescript
export default defineNuxtConfig({
  directus: {
    visualEditor: true, // Enable DirectusVisualEditor component
  },
})
```

When disabled, the `DirectusVisualEditor` component will be a no-op.

## Type Generation

### `types`

- **Type:** `boolean`
- **Default:** `true`

Enable/disable automatic type generation from your Directus schema.

```typescript
export default defineNuxtConfig({
  directus: {
    types: true, // Generate types from Directus schema
  },
})
```

**Requires `adminToken` to be set.**

When enabled, types are automatically generated and available globally:

```typescript
// Access generated types
type Article = DirectusSchema['articles']
type User = DirectusUsers
type File = DirectusFiles

// Use with Directus SDK - fully typed!
const directus = useDirectus()
const articles = await directus.request(readItems('articles'))
// articles is typed as Article[]
```

**Disable type generation:**
```typescript
export default defineNuxtConfig({
  directus: {
    types: false,
  },
})
```

## Authentication Options

### `auth`

Authentication configuration.

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      // Auth options here
    },
  },
})
```

#### `auth.enabled`

- **Type:** `boolean`
- **Default:** `true`

Enable/disable authentication features.

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      enabled: true,
    },
  },
})
```

#### `auth.enableGlobalAuthMiddleware`

- **Type:** `boolean`
- **Default:** `false`

Enable global authentication middleware on all routes.

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      enableGlobalAuthMiddleware: true, // All routes require auth by default
    },
  },
})
```

When enabled, all routes are protected. Allow public routes with:

```vue
<script setup>
definePageMeta({
  middleware: [] // Override global middleware
})
</script>
```

#### `auth.autoRefresh`

- **Type:** `boolean`
- **Default:** `true`

Automatically refresh authentication tokens before expiry.

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      autoRefresh: true, // Auto-refresh session tokens
    },
  },
})
```

#### `auth.credentials`

- **Type:** `'include' | 'omit' | 'same-origin'`
- **Default:** `'include'`

Credentials mode for cross-domain requests.

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      credentials: 'include', // Required for cross-domain cookies
    },
  },
})
```

**Options:**
- `'include'` - Always send cookies (required for cross-domain)
- `'same-origin'` - Only send cookies for same-origin requests
- `'omit'` - Never send cookies

#### `auth.realtimeAuthMode`

- **Type:** `'public' | 'handshake' | 'strict'`
- **Default:** `'public'`

WebSocket authentication mode for realtime features.

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      realtimeAuthMode: 'handshake',
    },
  },
})
```

**Modes:**
- `'public'` - No authentication required
- `'handshake'` - Authenticate during connection
- `'strict'` - Full authentication required

#### `auth.readMeFields`

- **Type:** `Array<string>`
- **Default:** `[]` (fetches all fields)

Fields to fetch for the current user.

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      readMeFields: ['id', 'email', 'first_name', 'last_name', 'avatar'],
    },
  },
})
```

Reduces payload size by only fetching needed fields.

#### `auth.redirect`

Redirect configuration for authentication.

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      redirect: {
        home: '/',                  // After login
        login: '/account/login',    // When not authenticated
        logout: '/',                // After logout
      },
    },
  },
})
```

##### `auth.redirect.home`

- **Type:** `string`
- **Default:** `'/'`

Where to redirect after successful login.

##### `auth.redirect.login`

- **Type:** `string`
- **Default:** `'/account/login'`

Where to redirect when authentication is required.

##### `auth.redirect.logout`

- **Type:** `string`
- **Default:** `'/'`

Where to redirect after logout.

## Complete Configuration Example

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-directus-sdk'],

  directus: {
    // Core configuration
    adminToken: process.env.DIRECTUS_ADMIN_TOKEN,

    // Development
    devProxy: {
      enabled: true,
      path: '/directus',
    },
    devtools: true,
    visualEditor: true,

    // Type generation
    types: {
      enabled: true,
      prefix: 'App',
    },

    // Authentication
    auth: {
      enabled: true,
      enableGlobalAuthMiddleware: false,
      autoRefresh: true,
      credentials: 'include',
      realtimeAuthMode: 'handshake',
      readMeFields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'role'],
      redirect: {
        home: '/dashboard',
        login: '/auth/login',
        logout: '/auth/login',
      },
    },
  },
})
```

## Environment Variables

### Development (.env)

```env
# Required
DIRECTUS_URL=http://localhost:8055

# Optional (for type generation and admin operations)
DIRECTUS_ADMIN_TOKEN=your-admin-token-here
```

### Production

For production, set environment variables in your hosting platform:

**Vercel:**
```bash
vercel env add DIRECTUS_URL production
vercel env add DIRECTUS_ADMIN_TOKEN production
```

**Netlify:**
```bash
# In Netlify UI: Site settings → Environment variables
DIRECTUS_URL=https://your-directus.com
DIRECTUS_ADMIN_TOKEN=your-token
```

**Docker:**
```dockerfile
ENV DIRECTUS_URL=https://your-directus.com
ENV DIRECTUS_ADMIN_TOKEN=your-token
```

## Runtime Config Access

Access configuration at runtime:

```typescript
// Client-side and server-side
const config = useRuntimeConfig()
console.log(config.public.directus.url)

// Server-side only (includes adminToken)
const config = useRuntimeConfig()
console.log(config.directus.adminToken)
```

**Note:** `adminToken` is automatically excluded from public runtime config for security.

## TypeScript Configuration

The module automatically adds type declarations. Ensure your `tsconfig.json` extends Nuxt's config:

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

Generated types are available globally:

```typescript
// Access generated types
type Article = DirectusSchema['articles']
type User = DirectusUsers
type File = DirectusFiles

// Use with Directus SDK
const directus = useDirectus()
const articles = await directus.request(readItems('articles'))
// articles is typed as Article[]
```

## Directus Server Configuration

### Required Directus Settings

For the module to work correctly, configure your Directus instance:

```env
# Directus .env

# Authentication
AUTH_LOCAL_MODE=session

# Session cookies
SESSION_COOKIE_SECURE=true  # false in development
SESSION_COOKIE_SAME_SITE=Lax  # None for cross-domain
SESSION_COOKIE_DOMAIN=.yourdomain.com  # For cross-domain

# CORS (required)
CORS_ENABLED=true
CORS_ORIGIN=https://your-nuxt-app.com
CORS_CREDENTIALS=true

# Realtime/WebSocket (optional)
WEBSOCKETS_ENABLED=true
WEBSOCKETS_REST_AUTH=strict
```

### Same Domain Setup

If Nuxt and Directus are on the same domain:

```env
# Directus .env
SESSION_COOKIE_SECURE=false  # true in production
SESSION_COOKIE_SAME_SITE=Lax
CORS_ORIGIN=http://localhost:3000
```

### Cross-Domain Setup

If on different domains (e.g., app.example.com and api.example.com):

```env
# Directus .env
SESSION_COOKIE_DOMAIN=.example.com  # Shared parent domain
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None  # Required for cross-domain
CORS_ORIGIN=https://app.example.com
```

## See Also

- [Getting Started](/guide/getting-started)
- [Authentication Guide](/guide/authentication)
- [Server-Side Utils](/guide/server-side)
- [Composables Reference](/api/composables)
