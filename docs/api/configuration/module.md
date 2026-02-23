---
outline: deep
---

# Module Options

Configure the module in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-directus-sdk'],

  directus: {
    // Configuration options here
  },
})
```

>[!NOTE]
>::: details Module options automatically loaded into runtime config. `adminToken` is automatically excluded from public runtime config for security.
>
>
>```typescript
>// Client-side and server-side
>const config = useRuntimeConfig()
>console.log(config.public.directus.url)
>
>// Server-side only (includes adminToken)
>const config = useRuntimeConfig()
>console.log(config.directus.adminToken)
>```


::: details All Configuration Options

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-directus-sdk'],

  directus: { // [!code focus:40]
    // Core configuration — simple string
    url: process.env.DIRECTUS_URL,
    // Or split URLs for Docker/K8s:
    // url: { client: 'https://cms.example.com', server: 'http://directus:8055' },
    adminToken: process.env.DIRECTUS_ADMIN_TOKEN,

    // Development
    devProxy: {
      enabled: true,
      path: '/directus',
      wsPath: '/directus-ws',
    },
    devtools: true,
    visualEditor: true,

    // Image integration
    image: true, // Directus provider is automatically configured

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
        home: '/',
        login: '/auth/login',
        logout: '/',
      },
    },
  },
})
```

:::

### Core Options

#### `url`

- **Type:** `string | { client: string, server: string }`
- **Required:** Yes
- **Default:** `process.env.DIRECTUS_URL`
- **Environment Variable:** `DIRECTUS_URL`

Your Directus instance URL. Can be a simple string, or an object with separate `client` and `server` URLs for environments where SSR needs to reach Directus via an internal hostname (e.g. Docker, Kubernetes).

```typescript
export default defineNuxtConfig({
  directus: {
    // Simple string — used everywhere
    url: 'https://your-directus-instance.com',

    // Or split URLs for Docker/K8s
    url: {
      client: 'https://cms.example.com',    // Browser requests
      server: 'http://directus:8055',        // SSR / server-side requests
    },
  },
})
```

Or use environment variable (string form only):

```dotenv
DIRECTUS_URL=https://your-directus-instance.com
```

::: tip When to use split URLs
Use the object form when your Nuxt server can reach Directus via an internal network address that browsers can't access. Common scenarios:
- **Docker Compose**: `server: 'http://directus:8055'` (container name)
- **Kubernetes**: `server: 'http://directus-service.default.svc.cluster.local:8055'`
- **Private network**: `server: 'http://10.0.0.5:8055'`

The `client` URL is what browsers use and what SSO redirects point to. The `server` URL is only used during SSR and is never exposed to the browser.
:::

#### `adminToken`

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

```dotenv
DIRECTUS_ADMIN_TOKEN=your-admin-token-here
```

**Security Note:** Never commit admin tokens to version control. Always use environment variables.

### Development Options

#### `devProxy`

- **Type:** `boolean | { enabled?: boolean, path?: string, wsPath?: string }`
- **Default:** `{ enabled: true, path: '/directus', wsPath: '/directus-ws' }` in dev mode
- **Default:** `false` in production

Development proxy configuration. When enabled, creates a proxy that forwards requests to your Directus instance, eliminating CORS issues and supporting dynamic ports.

```typescript
export default defineNuxtConfig({
  directus: {
    // Simple boolean
    devProxy: true,

    // Or detailed configuration
    devProxy: {
      enabled: true,
      path: '/directus',      // HTTP proxy mount path
      wsPath: '/directus-ws', // WebSocket proxy path (optional)
    },
  },
})
```

**How it works:**
- In development: Requests automatically route through the proxy using the current port
- Supports Nuxt's dynamic port changes (e.g., port 3000 → 3001)
- In production: Direct connection to Directus URL
- WebSocket proxy available at `wsPath` for realtime features

**Disable proxy:**
```typescript
export default defineNuxtConfig({
  directus: {
    devProxy: false, // Use direct connection in dev
  },
})
```

#### `devtools`

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

#### `visualEditor`

- **Type:** `boolean`
- **Default:** `true`

Enable visual editor capabilities. When enabled, the module:

- Automatically detects when your site is loaded inside a Directus admin iframe
- Renders `data-directus` attributes on `DirectusVisualEditor` components (only inside the iframe)
- Applies the `@directus/visual-editing` SDK to enable inline editing
- Shows `DirectusEditButton` and `DirectusAddButton` components (only inside the iframe)
- Calls `refreshNuxtData()` when content is saved (no full page reload)

```typescript
export default defineNuxtConfig({
  directus: {
    visualEditor: true, // Enable visual editor (default)
  },
})
```

When disabled, `DirectusVisualEditor` renders as a pass-through wrapper with no attributes, and `DirectusEditButton`/`DirectusAddButton` are hidden.

Add `?debug` to any page URL to enable debug logging for the visual editor in the browser console. This is useful for diagnosing CSP issues, URL mismatches, and iframe detection on staging/production deployments.

#### `image`

- **Type:** `boolean | { enabled?: boolean, setDefaultProvider?: boolean }`
- **Default:** `true`

Configure `@nuxt/image` integration with Directus provider.

```typescript
export default defineNuxtConfig({
  directus: {
    // Enable with defaults
    image: true,

    // Disable @nuxt/image integration
    image: false,

    // Set Directus as default provider
    image: {
      setDefaultProvider: true,
    },
  },
})
```

##### Options

- **`enabled`** (`boolean`, default: `true`) - Enable/disable `@nuxt/image` integration
- **`setDefaultProvider`** (`boolean`, default: `false`) - Set Directus as the default provider for `<NuxtImg>` components (no need to specify `provider="directus"`)

When enabled, the module automatically:
- Installs and configures `@nuxt/image`
- Sets up the Directus provider with your instance's assets endpoint

##### Usage

With `setDefaultProvider: false` (default):

```vue
<NuxtImg
  provider="directus"
  src="your-file-id"
  width="800"
  height="600"
/>
```

With `setDefaultProvider: true`:

```vue
<!-- No need to specify provider -->
<NuxtImg
  src="your-file-id"
  width="800"
  height="600"
/>
```

See the [File Management Guide](/guide/files#using-with-nuxt-image) for more details.

### Type Generation

#### `types`

- **Type:** `boolean | { enabled?: boolean, prefix?: string }`
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

##### Type Prefix

Add a prefix to your custom collection types to avoid naming conflicts:

```typescript
export default defineNuxtConfig({
  directus: {
    types: {
      enabled: true,
      prefix: 'App', // Prefix custom collection types
    },
  },
})
```

With a prefix, your generated types will be:

```typescript
// Custom collections are prefixed
interface AppBlog {
  id: string
  title: string
  content: string
}

interface AppAuthor {
  id: string
  name: string
}

// DirectusSchema keys remain unchanged (match API endpoints)
interface DirectusSchema {
  blogs: AppBlog[]
  authors: AppAuthor[]
}

// Directus system collections are NOT prefixed
interface DirectusUsers {
  id: string
  email: string
}
```

**How it works:**
- Custom collection interface names get prefixed (e.g., `Blog` → `AppBlog`)
- DirectusSchema keys stay unchanged (e.g., `blogs`, `authors`) to match API endpoints
- Directus system collections (e.g., `DirectusUsers`, `DirectusFiles`) are NOT prefixed
- All type references are updated to use the prefixed names

### Authentication Options

#### `auth`

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

##### `auth.enabled`

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

##### `auth.enableGlobalAuthMiddleware`

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

##### `auth.autoRefresh`

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

##### `auth.credentials`

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

##### `auth.realtimeAuthMode`

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

##### `auth.readMeFields`

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

##### `auth.redirect`

Redirect configuration for authentication.

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      redirect: {
        home: '/',                  // After login
        login: '/auth/login',    // When not authenticated
        logout: '/',                // After logout
      },
    },
  },
})
```

###### `auth.redirect.home`

- **Type:** `string`
- **Default:** `'/'`

Where to redirect after successful login.

###### `auth.redirect.login`

- **Type:** `string`
- **Default:** `'/auth/login'`

Where to redirect when authentication is required.

###### `auth.redirect.logout`

- **Type:** `string`
- **Default:** `'/'`

Where to redirect after logout.