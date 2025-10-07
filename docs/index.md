---
layout: home

hero:
  name: "Nuxt Directus SDK"
  text: "The Complete Integration"
  tagline: "Seamlessly connect Nuxt with Directus CMS - featuring authentication, realtime, file management, visual editing, and 101+ production-ready features"
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/directus-community/nuxt-directus-sdk

features:
  - icon: 🔐
    title: Session-Based Authentication
    details: Secure httpOnly cookies, auto-login, SSO support (Google, GitHub, etc.), password reset, user management - all handled automatically
    link: /guide/authentication

  - icon: ⚡
    title: Realtime & WebSockets
    details: Live collection subscriptions with automatic authentication. Dev proxy handles WebSocket connections with cookie forwarding
    link: /guide/realtime

  - icon: 🛠️
    title: Zero-Config Development
    details: Auto-imports, dev proxy (no CORS), auto-generated TypeScript types, Directus admin in DevTools - everything just works
    link: /guide/getting-started

  - icon: 📁
    title: File Management
    details: Single/batch uploads, image transformations (resize, format, quality), smart URL generation with parameters
    link: /guide/files

  - icon: 🎨
    title: Visual Editor
    details: Live preview mode with inline editing. DirectusVisualEditor component activates with ?preview=true query parameter
    link: /guide/visual-editor

  - icon: 🔒
    title: Production Ready
    details: Full SSR support, secure cookies, CORS handling, route protection, type-safe server utilities, and security best practices
    link: /guide/server-side

  - icon: 🚀
    title: Complete SDK Access
    details: Full Directus SDK integration with 80+ auto-imported functions, deep queries, relationship expansion, and type safety
    link: /api/composables

  - icon: ⚙️
    title: Flexible Configuration
    details: Comprehensive configuration options for auth, proxy, types, devtools, and more - customize everything to your needs
    link: /api/configuration
---

## Quick Example

Get started in minutes with full type safety and auto-imports:

```vue
<script setup>
// Everything is auto-imported and fully typed!
const { user, login, logout, loggedIn } = useDirectusAuth()
const directus = useDirectus()

// Fetch data with type safety
const { data: posts } = await useAsyncData('posts', () =>
  directus.request(readItems('posts', {
    fields: ['*'],
    limit: 10
  }))
)

// Subscribe to realtime updates
await directus.connect()
const { subscription } = await directus.subscribe('posts')
</script>

<template>
  <div>
    <!-- Authentication state -->
    <div v-if="loggedIn">
      <p>Welcome, {{ user.email }}</p>
      <button @click="logout()">Logout</button>
    </div>

    <!-- Visual editing in preview mode -->
    <div v-for="post in posts" :key="post.id">
      <DirectusVisualEditor collection="posts" :item="post.id">
        <h2>{{ post.title }}</h2>
        <p>{{ post.content }}</p>
      </DirectusVisualEditor>
    </div>
  </div>
</template>
```

## Installation

```bash
npm install nuxt-directus-sdk
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-directus-sdk'],
  directus: {
    url: process.env.DIRECTUS_URL,
  },
})
```

```env
# .env
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_ADMIN_TOKEN=your_admin_token
```

That's it! The module handles:
- ✅ Auto-generated TypeScript types
- ✅ Auto-imports for all functions
- ✅ Development proxy (no CORS issues)
- ✅ WebSocket proxy with authentication
- ✅ Session-based authentication
- ✅ Devtools integration

## Why Choose This Module?

### vs. Manual Integration
- **101+ features** vs. hours of custom code
- **Zero configuration** vs. complex setup
- **Production ready** vs. experimental
- **Fully tested** vs. untested edge cases

### Key Advantages
- **Session-based auth** (more secure) - httpOnly cookies vs. exposed tokens
- **Full WebSocket support** - Dev proxy with cookie forwarding
- **Visual editor** - Integrated live preview mode
- **Auto-generated types** - Always in sync with your Directus schema
- **Active maintenance** - Regular updates and community support

## License

MIT License - Free to use in personal and commercial projects
