# directus-nuxt-sdk

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> A bunch of directus helpers for nuxt applications

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- ⛰ &nbsp;Built-in Directus auth and type generation
- 🚠 &nbsp;Built-in helpers and utils 

## Quick Setup

1. Add `directus-nuxt-sdk` dependency to your project

```bash
# Using pnpm
pnpm add -D directus-nuxt-sdk

# Using yarn
yarn add --dev directus-nuxt-sdk

# Using npm
npm install --save-dev directus-nuxt-sdk

# Using bun
bun install --save-dev directus-nuxt-sdk
```

2. Add `directus-nuxt-sdk` to the `modules` section of `nuxt.config.ts`

```js
export default defineNuxtConfig({
  modules: [
    'directus-nuxt-sdk'
  ]
})
```

That's it! You can now use Directus your Nuxt app ✨

## Development

```bash
# Install dependencies
npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground
npm run dev

# Build the playground
npm run dev:build

# Run ESLint
npm run lint

# Run Vitest
npm run test
npm run test:watch

# Release new version
npm run release
```

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/directus-nuxt-sdk/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/directus-nuxt-sdk

[npm-downloads-src]: https://img.shields.io/npm/dm/directus-nuxt-sdk.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/directus-nuxt-sdk

[license-src]: https://img.shields.io/npm/l/directus-nuxt-sdk.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/directus-nuxt-sdk

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
