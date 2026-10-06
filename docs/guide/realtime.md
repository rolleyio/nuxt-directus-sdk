# Realtime & WebSockets

nuxt-directus-sdk provides full WebSocket support for realtime updates from your Directus collections. The module handles WebSocket authentication automatically using your session cookies.

## Quick Start

### `useDirectusSubscription` (Recommended)

Subscribe to a collection from a component. The composable connects on the client, keeps a reactive `items` list in sync with `init`, `create`, `update` and `delete` events, and unsubscribes when the component unmounts.

```vue
<script setup lang="ts">
const { items: posts, status, error } = useDirectusSubscription('posts', {
  query: {
    fields: ['id', 'title'],
    filter: { status: { _eq: 'published' } },
  },
})
</script>

<template>
  <p v-if="status === 'connecting'">Connecting...</p>
  <p v-else-if="error">{{ error.message }}</p>
  <div v-for="post in posts" :key="post.id">
    {{ post.title }}
  </div>
</template>
```

It does nothing during SSR, so pair it with `useDirectusItems()` if the first render needs data. See the [`useDirectusSubscription` API](#usedirectussubscription-collection-options) for every option.

### Basic Subscription

```typescript
const directus = useDirectus()

// Connect to WebSocket
await directus.connect()

// Subscribe to a collection
const { subscription } = await directus.subscribe('posts', {
  query: {
    fields: ['*'],
    filter: {
      status: { _eq: 'published' }
    }
  }
})

// Listen for updates
for await (const message of subscription) {
  if (message.event === 'create') {
    console.log('New post created:', message.data)
  }
  if (message.event === 'update') {
    console.log('Post updated:', message.data)
  }
  if (message.event === 'delete') {
    console.log('Post deleted:', message.data)
  }
}

// Unsubscribe when done
subscription.unsubscribe()
```

### Reactive Example

```vue
<script setup>
const directus = useDirectus()
const posts = ref([])

onMounted(async () => {
  // Load initial data
  posts.value = await directus.request(readItems('posts'))

  // Connect and subscribe
  await directus.connect()
  const { subscription } = await directus.subscribe('posts')

  // Update reactively
  for await (const message of subscription) {
    if (message.event === 'create') {
      posts.value.push(message.data[0])
    }
    if (message.event === 'update') {
      const index = posts.value.findIndex(p => p.id === message.data[0].id)
      if (index !== -1) {
        posts.value[index] = message.data[0]
      }
    }
    if (message.event === 'delete') {
      posts.value = posts.value.filter(p => !message.data.includes(p.id))
    }
  }
})

onBeforeUnmount(() => {
  subscription.unsubscribe()
})
</script>

<template>
  <div v-for="post in posts" :key="post.id">
    {{ post.title }}
  </div>
</template>
```

## Configuration

### Directus Configuration

Enable WebSockets in your Directus instance:

```dotenv
# Directus .env
WEBSOCKETS_ENABLED=true

# Authentication mode
WEBSOCKETS_REST_AUTH=strict  # or 'public' or 'handshake'
WEBSOCKETS_REST_AUTH_TIMEOUT=30000
```

::: warning CORS Required on Directus 12.1+
Since Directus 12.1, WebSocket connections are validated against `CORS_ORIGIN`. Make sure your Nuxt app's origin is included, or connections will be rejected:

```dotenv
# Directus .env
CORS_ENABLED=true
CORS_ORIGIN=https://app.example.com,http://localhost:3000
```
:::

### Nuxt Configuration

Configure realtime auth mode in your Nuxt app:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  directus: {
    auth: {
      realtimeAuthMode: 'public', // 'public', 'handshake', or 'strict'
    },
  },
})
```

## Authentication Modes

### Public Mode (Recommended)

With session-based authentication and `WEBSOCKETS_REST_AUTH=strict` in Directus:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  directus: {
    auth: {
      realtimeAuthMode: 'public', // Default
    },
  },
})
```

The WebSocket authentication is handled by the session cookie automatically forwarded through the WebSocket proxy.

### Handshake Mode

Authenticates during the initial WebSocket handshake:

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      realtimeAuthMode: 'public', // Default - recommended
    },
  },
})
```

Requires `WEBSOCKETS_REST_AUTH=handshake` in Directus.

### Strict Mode

Per-message authentication (more overhead):

```typescript
export default defineNuxtConfig({
  directus: {
    auth: {
      realtimeAuthMode: 'strict',
    },
  },
})
```

## Development Proxy

In development mode, WebSocket connections use a special proxy route (`/directus-ws`) that:
- Forwards WebSocket connections to Directus
- Includes session cookies for authentication
- Handles secure WebSocket upgrades

This is automatic - no configuration needed!

## Subscription API

### `useDirectusSubscription(collection, options?)`

**Options** (plus everything `directus.subscribe()` accepts, such as `query`, `event` and `uid`):

| Option | Default | Description |
| --- | --- | --- |
| `syncList` | `true` | Keep `items` in sync from subscription events. Set `false` to only use `lastEvent`. |
| `keyField` | `'id'` | Field used to match `update` and `delete` events to existing items. |
| `immediate` | `true` | Connect on setup. Set `false` and call `connect()` yourself. |

**Returns:**

| Property | Type | Description |
| --- | --- | --- |
| `items` | `Ref<Item[]>` | The synced list (empty when `syncList` is `false`). |
| `status` | `Ref<'idle' \| 'connecting' \| 'open' \| 'error' \| 'closed'>` | Connection state. |
| `error` | `Ref<Error \| null>` | The last subscription or connection error. |
| `lastEvent` | `Ref<{ event, data } \| null>` | The most recent message. |
| `connect()` | `() => Promise<void>` | Connect, or reconnect after `disconnect()`. |
| `disconnect()` | `() => void` | Unsubscribe. Also runs automatically when the scope is disposed. |

If an item arrives without the `keyField`, the composable sets `error`, moves to `'error'` and unsubscribes rather than guessing. Include the key field in `query.fields`.

### Subscribe to Collection

```typescript
const { subscription } = await directus.subscribe('collection_name', {
  query: {
    fields: ['*'],
    filter: { /* filter options */ },
    limit: 100,
  },
  uid: 'optional-uid' // Unique identifier for this subscription
})
```

### Event Types

```typescript
for await (const message of subscription) {
  switch (message.event) {
    case 'init':
      // Initial connection
      console.log('Subscription active')
      break
    case 'create':
      // New item created
      console.log('Created:', message.data)
      break
    case 'update':
      // Item updated
      console.log('Updated:', message.data)
      break
    case 'delete':
      // Item deleted
      console.log('Deleted:', message.data) // Array of IDs
      break
  }
}
```

### Unsubscribe

```typescript
// Unsubscribe from specific subscription
subscription.unsubscribe()

// Disconnect entirely
await directus.disconnect()
```

## Advanced Usage

### Multiple Subscriptions

```typescript
const directus = useDirectus()
await directus.connect()

// Subscribe to multiple collections
const posts = await directus.subscribe('posts')
const comments = await directus.subscribe('comments')
const users = await directus.subscribe('directus_users')

// Handle each subscription
Promise.all([
  (async () => {
    for await (const msg of posts.subscription) {
      console.log('Post event:', msg)
    }
  })(),
  (async () => {
    for await (const msg of comments.subscription) {
      console.log('Comment event:', msg)
    }
  })(),
])
```

### Filtered Subscriptions

```typescript
// Only subscribe to published posts
const { subscription } = await directus.subscribe('posts', {
  query: {
    filter: {
      status: { _eq: 'published' },
      author: { _eq: '$CURRENT_USER' }
    }
  }
})
```

### Composable Pattern

Create a reusable composable:

```typescript
// composables/useRealtimePosts.ts
export function useRealtimePosts() {
  const directus = useDirectus()
  const posts = ref([])
  const connected = ref(false)
  let subscription: any = null

  async function connect() {
    // Load initial data
    posts.value = await directus.request(readItems('posts'))

    // Connect WebSocket
    await directus.connect()
    connected.value = true

    // Subscribe
    const result = await directus.subscribe('posts')
    subscription = result.subscription

    // Handle updates
    for await (const message of subscription) {
      if (message.event === 'create') {
        posts.value.push(...message.data)
      }
      if (message.event === 'update') {
        message.data.forEach((updated) => {
          const index = posts.value.findIndex(p => p.id === updated.id)
          if (index !== -1) {
            posts.value[index] = updated
          }
        })
      }
      if (message.event === 'delete') {
        posts.value = posts.value.filter(p => !message.data.includes(p.id))
      }
    }
  }

  function disconnect() {
    if (subscription) {
      subscription.unsubscribe()
    }
    connected.value = false
  }

  return {
    posts,
    connected,
    connect,
    disconnect,
  }
}
```

Usage:

```vue
<script setup>
const { posts, connected, connect, disconnect } = useRealtimePosts()

onMounted(() => connect())
onBeforeUnmount(() => disconnect())
</script>

<template>
  <div>
    <p v-if="connected">
      🟢 Live
    </p>
    <div v-for="post in posts" :key="post.id">
      {{ post.title }}
    </div>
  </div>
</template>
```

## Troubleshooting

### WebSocket Connection Failed

1. ✅ Check `WEBSOCKETS_ENABLED=true` in Directus
2. ✅ Verify `WEBSOCKETS_REST_AUTH` matches your `realtimeAuthMode`
3. ✅ Ensure you're authenticated before connecting
4. ✅ Check browser console for WebSocket errors

### Authentication Errors

1. ✅ Verify session cookie exists (`directus_session_token`)
2. ✅ Check `WEBSOCKETS_REST_AUTH=strict` in Directus
3. ✅ Use `realtimeAuthMode: 'public'` in Nuxt config
4. ✅ Make sure you're logged in before connecting

### Connection Stuck on "Pending"

1. ✅ Check Directus logs for WebSocket errors
2. ✅ Verify WebSocket URL is correct (check browser dev tools → Network → WS)
3. ✅ Ensure development proxy is running
4. ✅ Check for CORS issues in Directus

### Updates Not Received

1. ✅ Verify subscription is active: `subscription.unsubscribe` exists
2. ✅ Check Directus permissions allow read access
3. ✅ Ensure filter query matches the data you're changing
4. ✅ Test with a simple subscription (no filters)

## See Also

- [Directus Realtime Docs](https://docs.directus.io/guides/real-time/)
- [Authentication](/guide/authentication)
- [Configuration Reference](/api/configuration/)
