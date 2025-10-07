# Getting Started

Get up and running with nuxt-directus-sdk in minutes.

## Installation

Install the module using your package manager:

::: code-group
```bash [npm]
npm install nuxt-directus-sdk
```

```bash [yarn]
yarn add nuxt-directus-sdk
```

```bash [pnpm]
pnpm add nuxt-directus-sdk
```

```bash [bun]
bun add nuxt-directus-sdk
```
:::

## Configuration

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-directus-sdk'],

  directus: {
  },
})
```

## Environment Variables

Create a `.env` file in your project root:

```env
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_ADMIN_TOKEN=your_admin_token_here
```

### Environment Variables Explained

- **`DIRECTUS_URL`** (required): Your Directus instance URL
- **`DIRECTUS_ADMIN_TOKEN`** (optional): Admin token for type generation and admin operations

## Directus Configuration

For the module to work properly, you need to configure your Directus instance:

### Basic Setup (Same Domain)

If your Nuxt app and Directus are on the same domain (e.g., `localhost` in development):

```env
# Directus .env
AUTH_LOCAL_MODE=session
SESSION_COOKIE_SECURE=false  # true in production
SESSION_COOKIE_SAME_SITE=Lax

CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# For realtime features
WEBSOCKETS_ENABLED=true
WEBSOCKETS_REST_AUTH=strict
```

### Cross-Domain Setup

If your frontend and backend are on different domains:

```env
# Directus .env
AUTH_LOCAL_MODE=session
SESSION_COOKIE_DOMAIN=.yourdomain.com  # Shared parent domain
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None

CORS_ENABLED=true
CORS_ORIGIN=https://app.yourdomain.com
CORS_CREDENTIALS=true

# For realtime features
WEBSOCKETS_ENABLED=true
WEBSOCKETS_REST_AUTH=strict
```

## Verify Installation

Create a simple page to test the integration:

```vue
<script setup>
const { user, loggedIn } = useDirectusAuth()
const directus = useDirectus()

const { data: items } = await useAsyncData('items', () =>
  directus.request(readItems('your_collection'))
)
</script>

<template>
  <div>
    <h1>nuxt-directus-sdk Test</h1>

    <div v-if="loggedIn">
      <p>Logged in as: {{ user.email }}</p>
    </div>
    <div v-else>
      <p>Not logged in</p>
    </div>

    <div v-if="items">
      <p>Successfully connected to Directus!</p>
      <p>Item count: {{ items.length }}</p>
    </div>
  </div>
</template>
```

## Development Proxy

In development mode, the module automatically creates a proxy at `/directus` that forwards requests to your Directus instance. This eliminates CORS issues.

You can configure the proxy:

```typescript
export default defineNuxtConfig({
  directus: {

    // Proxy configuration (optional)
    devProxy: {
      enabled: true,  // default: true in dev mode
      path: '/directus',  // default: '/directus'
    },
  },
})
```

## Type Generation

The module automatically generates TypeScript types from your Directus schema. Make sure you have `DIRECTUS_ADMIN_TOKEN` set in your `.env` file.

To disable type generation:

```typescript
export default defineNuxtConfig({
  directus: {

    types: {
      enabled: false,
    },
  },
})
```

## Next Steps

Now that you're set up, explore the features:

- [Authentication](/guide/authentication) - Session-based auth, SSO, user management
- [Realtime](/guide/realtime) - WebSocket connections and live updates
- [File Management](/guide/files) - Upload and transform files
- [Visual Editor](/guide/visual-editor) - Live preview and inline editing
- [Server-Side Utils](/guide/server-side) - Server routes and utilities
- [Configuration Reference](/api/configuration) - All configuration options
