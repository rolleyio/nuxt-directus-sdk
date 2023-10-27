# nuxt-directus-sdk

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> A Nuxt 3 Directus sdk module that uses the official SDK

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
- [🔗 Documentation - Coming soon!](http://nuxt-directus-sdk.vercel.app)

## Features

- ⛰ &nbsp;Authentication out of the box
- 🚠 &nbsp;Type generation based on Directus collections
- 🔥 &nbsp;Client websockets enabled
- 🌉 &nbsp;Automatically configures Nuxt Image for directus
- 🗂️ &nbsp;Directus Admin panel added to Devtools

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

```js
export default defineNuxtConfig({
  modules: [
    'nuxt-directus-sdk'
  ],
  directus: {
    url: '',
  }
})
```

3. OPTIONAL: Add an Directus admin token to .env file for additional goodies (Type generation, admin server directus)

DIRECTUS_ADMIN_TOKEN=""

That's it! You can now use Directus within your Nuxt app ✨

## Development

```bash
# Install dependencies
bun install

# Generate type stubs
bun run dev:prepare

# Develop with the playground
bun run dev

# Build the playground
bun run dev:build

# Run ESLint
bun run lint

# Run Vitest
bun run test
bun run test:watch

# Release new version
bun run release
```

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-directus-sdk/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-directus-sdk

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-directus-sdk.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-directus-sdk

[license-src]: https://img.shields.io/npm/l/nuxt-directus-sdk.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-directus-sdk

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
