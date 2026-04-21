# Changelog

## v6.0.0-beta.0

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v5.0.1...v6.0.0-beta.0)

### 🚀 Enhancements

- **peer-deps:** ⚠️  Bump peer dependencies ([55bcb7d](https://github.com/rolleyio/nuxt-directus-sdk/commit/55bcb7d))
- **peer-deps:** ⚠️  Bump @directus/visual-editing to 2.0 ([733dc4a](https://github.com/rolleyio/nuxt-directus-sdk/commit/733dc4a))

### 🩹 Fixes

- Refactor type generation so that there is no dependency for `directus-sdk-typegen` ([2236229](https://github.com/rolleyio/nuxt-directus-sdk/commit/2236229))
- **typegen:** Improve logging clarity ([cb48742](https://github.com/rolleyio/nuxt-directus-sdk/commit/cb48742))

### 💅 Refactors

- Improve logging ([07a93f8](https://github.com/rolleyio/nuxt-directus-sdk/commit/07a93f8))

### 📖 Documentation

- Add eslint to docs folder ([04d99b9](https://github.com/rolleyio/nuxt-directus-sdk/commit/04d99b9))
- Udpate example from webhooks to posts ([66654d5](https://github.com/rolleyio/nuxt-directus-sdk/commit/66654d5))
- Add directus-template-cli details to readme.md ([4eaf498](https://github.com/rolleyio/nuxt-directus-sdk/commit/4eaf498))
- Add eslint to docs folder ([5c42b88](https://github.com/rolleyio/nuxt-directus-sdk/commit/5c42b88))
- Udpate example from webhooks to posts ([0d49dda](https://github.com/rolleyio/nuxt-directus-sdk/commit/0d49dda))
- Update changelog for v5.0.1 ([b8d5580](https://github.com/rolleyio/nuxt-directus-sdk/commit/b8d5580))
- Fixes unlinted commit ([4bbdf7a](https://github.com/rolleyio/nuxt-directus-sdk/commit/4bbdf7a))

### 🏡 Chore

- Remove NPM artifacts ([e3bb9ab](https://github.com/rolleyio/nuxt-directus-sdk/commit/e3bb9ab))
- Update scripts ([91cec22](https://github.com/rolleyio/nuxt-directus-sdk/commit/91cec22))
- Remove dependency `change-case` ([897adeb](https://github.com/rolleyio/nuxt-directus-sdk/commit/897adeb))
- Keep @nuxt/devtools locked to stable branch ([37f5dbb](https://github.com/rolleyio/nuxt-directus-sdk/commit/37f5dbb))
- Bump defu & ufo ([8d4df23](https://github.com/rolleyio/nuxt-directus-sdk/commit/8d4df23))
- Bump nuxt 4.4.2 ([55e5b9a](https://github.com/rolleyio/nuxt-directus-sdk/commit/55e5b9a))
- Fix linting errors ([b89a905](https://github.com/rolleyio/nuxt-directus-sdk/commit/b89a905))
- Bump vitepress ([2b07f1c](https://github.com/rolleyio/nuxt-directus-sdk/commit/2b07f1c))
- Bump @nuxt/test-utils to 4.0.2 & vitest to 4.1.4 ([05efbf9](https://github.com/rolleyio/nuxt-directus-sdk/commit/05efbf9))
- Bump @antfu/eslint-config & eslint ([d0dcb9f](https://github.com/rolleyio/nuxt-directus-sdk/commit/d0dcb9f))
- Separate lint:fix and lint ([fbc820d](https://github.com/rolleyio/nuxt-directus-sdk/commit/fbc820d))
- Bump @antfu/eslint-config & eslint" ([b58aac1](https://github.com/rolleyio/nuxt-directus-sdk/commit/b58aac1))
- Fix linting in ci ([f82f21f](https://github.com/rolleyio/nuxt-directus-sdk/commit/f82f21f))
- Release workflow rework + Bun → pnpm migration ([d50d090](https://github.com/rolleyio/nuxt-directus-sdk/commit/d50d090))

### ✅ Tests

- Add mock data for readCollections, readFields, readRelations ([b1491d8](https://github.com/rolleyio/nuxt-directus-sdk/commit/b1491d8))
- Add test for generate-types flag ([868b31c](https://github.com/rolleyio/nuxt-directus-sdk/commit/868b31c))

### 🎨 Styles

- Inline suggestion not formatted correctly ([f59bf87](https://github.com/rolleyio/nuxt-directus-sdk/commit/f59bf87))

### 🤖 CI

- Update to checkout@v5 ([c42c0c7](https://github.com/rolleyio/nuxt-directus-sdk/commit/c42c0c7))
- Update to checkout@v5" ([6fdf9c7](https://github.com/rolleyio/nuxt-directus-sdk/commit/6fdf9c7))
- Checkout to v6 node to lts/jod ([467a9f8](https://github.com/rolleyio/nuxt-directus-sdk/commit/467a9f8))

#### ⚠️ Breaking Changes

- **peer-deps:** ⚠️  Bump peer dependencies ([55bcb7d](https://github.com/rolleyio/nuxt-directus-sdk/commit/55bcb7d))
- **peer-deps:** ⚠️  Bump @directus/visual-editing to 2.0 ([733dc4a](https://github.com/rolleyio/nuxt-directus-sdk/commit/733dc4a))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>
- Kevin Heiner <kheiner@gmail.com>

## v5.0.0...v5.0.1

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v5.0.0...v5.0.1)

### 🩹 Fixes

- Only set directus_instance_url cookie when session exists to allow CDN caching ([f073367](https://github.com/rolleyio/nuxt-directus-sdk/commit/f073367))
- Check @nuxt/image is installed before attempting to register it ([bf7ce46](https://github.com/rolleyio/nuxt-directus-sdk/commit/bf7ce46))

### 📖 Documentation

- Update changelog for v5.0.0 ([9ffdf21](https://github.com/rolleyio/nuxt-directus-sdk/commit/9ffdf21))
- Update changelog for v5.0.1-beta.1 ([5c13e60](https://github.com/rolleyio/nuxt-directus-sdk/commit/5c13e60))
- Update changelog for v5.0.1-beta.2 ([6731a41](https://github.com/rolleyio/nuxt-directus-sdk/commit/6731a41))
- Fix dead links by adding trailing slashes to API reference URLs ([d29180e](https://github.com/rolleyio/nuxt-directus-sdk/commit/d29180e))

### 🏡 Chore

- Bump version to 5.0.1-beta.1 ([195ecf9](https://github.com/rolleyio/nuxt-directus-sdk/commit/195ecf9))
- Bump version to 5.0.1-beta.2 ([92b57ca](https://github.com/rolleyio/nuxt-directus-sdk/commit/92b57ca))
- Bump version to 5.0.1 ([efd74be](https://github.com/rolleyio/nuxt-directus-sdk/commit/efd74be))

### 🤖 CI

- Fix changelogen to compare from previous tag ([2806026](https://github.com/rolleyio/nuxt-directus-sdk/commit/2806026))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>

## v5.0.1-beta.1...v5.0.1-beta.2

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v5.0.1-beta.1...v5.0.1-beta.2)

### 🩹 Fixes

- Check @nuxt/image is installed before attempting to register it ([bf7ce46](https://github.com/rolleyio/nuxt-directus-sdk/commit/bf7ce46))

### 📖 Documentation

- Update changelog for v5.0.1-beta.1 ([5c13e60](https://github.com/rolleyio/nuxt-directus-sdk/commit/5c13e60))

### 🏡 Chore

- Bump version to 5.0.1-beta.2 ([92b57ca](https://github.com/rolleyio/nuxt-directus-sdk/commit/92b57ca))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>

## v5.0.0...v5.0.1-beta.1

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v5.0.0...v5.0.1-beta.1)

### 🩹 Fixes

- Only set directus_instance_url cookie when session exists to allow CDN caching ([f073367](https://github.com/rolleyio/nuxt-directus-sdk/commit/f073367))

### 📖 Documentation

- Update changelog for v5.0.0 ([9ffdf21](https://github.com/rolleyio/nuxt-directus-sdk/commit/9ffdf21))

### 🏡 Chore

- Bump version to 5.0.1-beta.1 ([195ecf9](https://github.com/rolleyio/nuxt-directus-sdk/commit/195ecf9))

### 🤖 CI

- Fix changelogen to compare from previous tag ([2806026](https://github.com/rolleyio/nuxt-directus-sdk/commit/2806026))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>

## v5.0.0...v5.0.0

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v5.0.0...v5.0.0)

## v2.1.0

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v1.0.0...v2.1.0)

### 🚀 Enhancements

- Added types for nitro and key into getDirectusFileUrl ([849b8ed](https://github.com/rolleyio/nuxt-directus-sdk/commit/849b8ed))

### 🏡 Chore

- **release:** V1.0.1 ([b630156](https://github.com/rolleyio/nuxt-directus-sdk/commit/b630156))
- Switched to fetchUserFields as fetchUserParams didn't really make sense for readMe/updateMe ([12aaf1d](https://github.com/rolleyio/nuxt-directus-sdk/commit/12aaf1d))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>

## v1.0.1

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v1.0.0...v1.0.1)

## v1.0.0

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.16...v1.0.0)

### 🚀 Enhancements

- Added hook to get user when logged in ([688dc45](https://github.com/rolleyio/nuxt-directus-sdk/commit/688dc45))

### 🏡 Chore

- Updated readme ([16c5d44](https://github.com/rolleyio/nuxt-directus-sdk/commit/16c5d44))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>

## v0.0.16

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.15...v0.0.16)

### 🩹 Fixes

- Remove double slash ([bf6e157](https://github.com/rolleyio/nuxt-directus-sdk/commit/bf6e157))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>

## v0.0.15

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.14...v0.0.15)

### 🩹 Fixes

- Changed inline image for nuxtimage ([2d4cc60](https://github.com/rolleyio/nuxt-directus-sdk/commit/2d4cc60))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>

## v0.0.14

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.13...v0.0.14)

### 🚀 Enhancements

- Added nuxt image and updated directus sdk to 13 ([ef90eb1](https://github.com/rolleyio/nuxt-directus-sdk/commit/ef90eb1))

### 📦 Build

- Fixed eslint fixes ([203b0f4](https://github.com/rolleyio/nuxt-directus-sdk/commit/203b0f4))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>

## v0.0.13

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.12...v0.0.13)

## v0.0.12

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.11...v0.0.12)

## v0.0.11

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.10...v0.0.11)

## v0.0.10

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.9...v0.0.10)

## v0.0.9

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.8...v0.0.9)

## v0.0.8

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.7...v0.0.8)

## v0.0.7

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.6...v0.0.7)

## v0.0.6

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.5...v0.0.6)

## v0.0.5

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.4...v0.0.5)

## v0.0.4

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.3...v0.0.4)

## v0.0.3

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v0.0.2...v0.0.3)

## v0.0.2

