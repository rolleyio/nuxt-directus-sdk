# nuxt-directus-sdk

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> A Nuxt 3 Directus module that uses the official Directus 11 SDK

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- ⛰ &nbsp;Directus authentication out of the box
- 🚠 &nbsp;Automatic type generation based on Directus collections

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
[npm-version-src]: https://img.shields.io/npm/v/nuxt-directus-sdk/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-directus-sdk

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-directus-sdk.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-directus-sdk

[license-src]: https://img.shields.io/npm/l/nuxt-directus-sdk.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-directus-sdk

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
