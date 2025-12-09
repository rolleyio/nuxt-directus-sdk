# Getting Started

Get up and running with nuxt-directus-sdk in minutes.

## Installation

1. Install the module using your preferred package manager:

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

2. Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-directus-sdk'], // [!code focus]
  directus: {},
})
```
::: info
View all module options in the [API Reference > Configuration](../api/configuration.md#complete-configuration-example) page. 
:::

3. Add the following variables to the `.env` file in your nuxt project root:

```env
DIRECTUS_URL=https://url-to.directus.app
DIRECTUS_ADMIN_TOKEN=admin_token_required_for_typegen
```

  - **`DIRECTUS_URL`** (required): Your Directus instance URL
  - **`DIRECTUS_ADMIN_TOKEN`** (optional): Admin token for type generation and `useAdminDirectus()` module.


## Directus Configuration

For the module to work properly, you need to configure your Directus instance with the following environment variables depending on your environment:

::: code-group
```env [development]
CORS_ENABLED=true
CORS_ORIGIN=*
SESSION_COOKIE_DOMAIN=localhost
```
```env [same-domain]
SESSION_COOKIE_DOMAIN=http://url-to.nuxt.app
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None
```
```env [cross-domain]
CORS_ENABLED=true
CORS_ORIGIN=http://url-to.nuxt.app
AUTH_LOCAL_MODE=session
SESSION_COOKIE_DOMAIN=url-to.nuxt.app
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=none
```
:::

::: info
These configuration examples assume that you do not modify the default environment variables in Directus. Refer to [Directus Configuration](https://directus.io/docs/configuration/general) for details about environment variables and their defaults.
:::

### Optional Configuration

```env
WEBSOCKETS_ENABLED=true
```


## Verify Installation

Create a simple page to test the integration:

<<< @/snippets/quick-example.vue

::: info
The examples provided are written to work with the [directus-template-cli](https://github.com/directus-labs/directus-template-cli?tab=readme-ov-file#directus-template-cli) CMS Template provided by the Directus team.

To populate your Directus instance with the information used in the examples, use the following command:

```bash
npx directus-template-cli@latest apply
```

::: warning
The template cli will attempt to merge with your existing content, but is not guaranteed to preserve anything. It is recommended that you use the cli on a fresh instance for testing as needed or modify the examples to work with your existing data structures.
:::

<!-- 
//TODO: Convert to snippets to avoid code replication and ability to edit in multiple places.
-->

## Development Proxy

In development mode, the module automatically creates a proxy at `/directus` that forwards requests to your Directus instance. This eliminates CORS issues.

You can configure the proxy:

```typescript
export default defineNuxtConfig({
	directus: {
		// Proxy configuration (optional)
		devProxy: {
			enabled: true, // default: true in dev mode
			path: '/directus', // default: '/directus'
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
