# Introduction

**nuxt-directus-sdk** is a comprehensive Nuxt module that provides seamless integration with Directus CMS. It handles everything from authentication to realtime updates, making it the easiest way to build Nuxt applications with Directus.

## Why nuxt-directus-sdk?

Integrating Directus with Nuxt manually involves solving many complex problems:
- **Authentication**: Managing sessions, tokens, cookies across SSR/client
- **CORS**: Dealing with cross-origin requests in development
- **TypeScript**: Keeping types in sync with your Directus schema
- **WebSockets**: Setting up realtime connections with proper authentication
- **File handling**: Managing uploads and asset transformations

This module solves all of these problems and more, providing a **production-ready**, **type-safe**, and **developer-friendly** experience.

## Key Features

### 🔐 Complete Authentication System
- Session-based auth with httpOnly cookies (more secure than tokens)
- Auto-login on page load
- SSO/OAuth support (Google, GitHub, Microsoft, etc.)
- Full auth flow (login, logout, register, password reset, user invites)
- Works seamlessly across domains

### ⚡ Realtime & WebSocket Support
- Full WebSocket integration with automatic authentication
- Dev proxy that handles WebSocket connections
- Multiple auth modes (handshake, public, strict)
- Live subscriptions to collection changes

### 🛠️ Zero-Config Development
- Auto-imports for all Directus SDK functions
- Auto-generated TypeScript types from your schema
- Dev proxy eliminates CORS issues
- Directus admin panel in Nuxt DevTools

### 📁 File & Asset Management
- Single and batch file uploads
- Image transformations (resize, format conversion, quality control)
- Smart URL generation with parameters
- Support for signed URLs

### 🎨 Visual Editor
- Live preview mode with inline editing
- `<DirectusVisualEditor>` component
- Multiple edit modes (drawer, modal, popover)
- Works with Directus Visual Editing SDK

### 🔒 SSR Ready
- Full SSR support
- HttpOnly cookies for security
- CORS credential handling
- Route protection middleware
- Type-safe server utilities

## Quick Example

```vue
<script setup>
// Auto-imported, fully typed!
const { user, login, logout } = useDirectusAuth()
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
    <div v-if="loggedIn">
      <p>Welcome, {{ user.email }}</p>
      <button @click="logout()">Logout</button>
    </div>

    <div v-for="post in posts" :key="post.id">
      <DirectusVisualEditor collection="posts" :item="post.id">
        <h2>{{ post.title }}</h2>
        <p>{{ post.content }}</p>
      </DirectusVisualEditor>
    </div>
  </div>
</template>
```

## What's Next?

- [Installation](/guide/getting-started) - Get started in minutes
- [Authentication](/guide/authentication) - Learn about session-based auth
- [Realtime](/guide/realtime) - Set up WebSocket connections
- [API Reference](/api/configuration) - Full configuration options
