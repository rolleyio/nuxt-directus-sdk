# nuxt-directus-sdk

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![CI][ci-src]][ci-href]
[![Install size][install-size-src]][install-size-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> A Nuxt module for Directus with built-in authentication, realtime, file management, type generation, and visual editor support.

- [✨ &nbsp;Release Notes](https://github.com/rolleyio/nuxt-directus-sdk/releases)
- [📚 &nbsp;Documentation](https://nuxt-directus-sdk.rolley.io)
- [🛝 &nbsp;Live Playground](https://playground.nuxt-directus-sdk.rolley.io)

## Features

- 🔒 &nbsp;**Session-based authentication** with cross-domain support
- ⚡ &nbsp;**Realtime** via typed WebSocket subscriptions
- 📁 &nbsp;**File management** with `@nuxt/image` integration
- ✏️ &nbsp;**Visual editor** support for `@directus/visual-editing`
- 🧩 &nbsp;**Auto-generated types** from your Directus schema, plus a standalone CLI
- 📐 &nbsp;**Rules DSL** for defining and syncing permissions in code
- 🗂️ &nbsp;Directus admin panel embedded in Nuxt Devtools

## Requirements

- **Nuxt 4.0+**
- **Directus v11.16.0+** (required by the bundled `@directus/visual-editing` v2 and `@directus/sdk` v21)

## Quick Setup

1. Add `nuxt-directus-sdk` dependency to your project

```bash
# Using pnpm
pnpm add -D nuxt-directus-sdk

# Using yarn
yarn add --dev nuxt-directus-sdk

# Using npm
npm install --save-dev nuxt-directus-sdk

# Using bun
bun install --save-dev nuxt-directus-sdk
```

2. Add `nuxt-directus-sdk` to the `modules` section of `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ['nuxt-directus-sdk'],
  directus: {
    url: process.env.DIRECTUS_URL,
  },
})
```

3. Create a `.env` file:

```dotenv
DIRECTUS_URL=https://your-directus-url.com
DIRECTUS_ADMIN_TOKEN=your_admin_token # Optional: required for type generation
```

4. **Configure your Directus backend** for cross-domain authentication (see the [Authentication Guide](https://nuxt-directus-sdk.rolley.io/guide/authentication.html))

That's it! You can now use Directus within your Nuxt app ✨

For cross-domain setups (e.g. `app.example.com` and `api.example.com`), see the [Authentication Guide](https://nuxt-directus-sdk.rolley.io/guide/authentication.html).

## CLI

The module ships with a CLI for type generation and permissions/rules sync that doesn't require a running Nuxt instance. Useful in CI, pre-commit hooks, or quick regeneration during development.

```bash
# Generate TypeScript types from a Directus schema
npx nuxt-directus-sdk generate-types --prefix App -o types/directus.d.ts

# Pull permissions/rules to a JSON file
npx nuxt-directus-sdk rules:pull -o rules.json

# See all commands
npx nuxt-directus-sdk --help
```

See the [CLI documentation](https://nuxt-directus-sdk.rolley.io/api/configuration/module#types) for flags and examples.

## Development

> [!IMPORTANT] The playground uses the [directus-template-cli](https://github.com/directus-labs/directus-template-cli?tab=readme-ov-file#applying-a-template) `cms` template.
> Apply the template with `npx directus-template-cli@latest apply` and follow the interactive prompts.

```bash
# Install dependencies
pnpm install

# Add DIRECTUS_ADMIN_TOKEN to playground .env (don't forget to update your token)
cp ./playground/.env.example ./playground/.env

# Generate type stubs
pnpm run dev:prepare

# Develop with the playground
pnpm run dev

# Build the playground
pnpm run dev:build

# Run ESLint
pnpm run lint

# Run Vitest
pnpm run test
pnpm run test:watch

# Release new version (see RELEASING.md)
pnpm run release
```

## Contributing

Contributions are welcome. Please target the `next` branch for new features and fixes; `main` is reserved for stable releases and hotfixes. See [RELEASING.md](./RELEASING.md) for the release process.

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-directus-sdk/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-directus-sdk

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-directus-sdk.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-directus-sdk

[ci-src]: https://github.com/rolleyio/nuxt-directus-sdk/actions/workflows/ci.yml/badge.svg?branch=main
[ci-href]: https://github.com/rolleyio/nuxt-directus-sdk/actions/workflows/ci.yml

[install-size-src]: https://packagephobia.com/badge?p=nuxt-directus-sdk
[install-size-href]: https://packagephobia.com/result?p=nuxt-directus-sdk

[license-src]: https://img.shields.io/npm/l/nuxt-directus-sdk.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-directus-sdk

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
