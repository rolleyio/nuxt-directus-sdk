# Changelog

## v6.0.0-beta.3

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v6.0.0-beta.2...v6.0.0-beta.3)

### 🚀 Enhancements

- **test:** Enable typecheck via vitest ([#72](https://github.com/rolleyio/nuxt-directus-sdk/pull/72))
- **types:** Add minimial core type declarations ([1faa898](https://github.com/rolleyio/nuxt-directus-sdk/commit/1faa898))

### 🩹 Fixes

- **types:** Null type guards in rules & runtime ([a0035a7](https://github.com/rolleyio/nuxt-directus-sdk/commit/a0035a7))
- **types:** Derive types from return value in playground/pages/files.vue ([ccd2719](https://github.com/rolleyio/nuxt-directus-sdk/commit/ccd2719))
- **rules:** Convert index loops to for-of (satisfy no-unckeced-index-access) ([71b993a](https://github.com/rolleyio/nuxt-directus-sdk/commit/71b993a))
- **rules:** Fix Schema[K] to CollectionItem<Schema, K> ([00005f2](https://github.com/rolleyio/nuxt-directus-sdk/commit/00005f2))
- **rules:** Correct payload parameter types ([b81bc7b](https://github.com/rolleyio/nuxt-directus-sdk/commit/b81bc7b))
- **runtime:** Resolve strict TypeScript errors ([f9818a5](https://github.com/rolleyio/nuxt-directus-sdk/commit/f9818a5))
- **typegenerator:** Always emit `types/directus.d.ts` when typegen enabled ([215c323](https://github.com/rolleyio/nuxt-directus-sdk/commit/215c323))
- **test:** Add extra non-null assertion to array ([ac74d5f](https://github.com/rolleyio/nuxt-directus-sdk/commit/ac74d5f))
- **files:** Correct type errors and improve safety in composable ([58d5da1](https://github.com/rolleyio/nuxt-directus-sdk/commit/58d5da1))
- **playground:** Correct imports in server API routes, add demo schema stubs ([8e8715f](https://github.com/rolleyio/nuxt-directus-sdk/commit/8e8715f))
- **types:** Consolidate fallback into a single source of truth (fallback.d.ts) ([436c8c3](https://github.com/rolleyio/nuxt-directus-sdk/commit/436c8c3))

### 💅 Refactors

- **rules:** Build policyById map in single pass ([327ab14](https://github.com/rolleyio/nuxt-directus-sdk/commit/327ab14))

### 📖 Documentation

- Add live playground link to README ([e632db9](https://github.com/rolleyio/nuxt-directus-sdk/commit/e632db9))
- Update type names and return types ([1bbed31](https://github.com/rolleyio/nuxt-directus-sdk/commit/1bbed31))
- Clarify node versions in ci/cd ([fbee833](https://github.com/rolleyio/nuxt-directus-sdk/commit/fbee833))
- Title case for headings ([aedfd96](https://github.com/rolleyio/nuxt-directus-sdk/commit/aedfd96))
- Add details for using manually created types ([97ad8d2](https://github.com/rolleyio/nuxt-directus-sdk/commit/97ad8d2))

### 🏡 Chore

- Add issue number to todolines ([63189b5](https://github.com/rolleyio/nuxt-directus-sdk/commit/63189b5))
- Require Node 22+ via engines field ([a90bd74](https://github.com/rolleyio/nuxt-directus-sdk/commit/a90bd74))
- Update domain references to nuxt-directus-sdk.com ([9bd7ef4](https://github.com/rolleyio/nuxt-directus-sdk/commit/9bd7ef4))

### ✅ Tests

- **types:** Add type testing with vue-tsc ([dbc38cd](https://github.com/rolleyio/nuxt-directus-sdk/commit/dbc38cd))
- Add non-null assertions to array element ([9942f57](https://github.com/rolleyio/nuxt-directus-sdk/commit/9942f57))
- Add wsPath to devProxy mock type ([5beae25](https://github.com/rolleyio/nuxt-directus-sdk/commit/5beae25))
- Add cast for permissions shape ([1163926](https://github.com/rolleyio/nuxt-directus-sdk/commit/1163926))
- **rules:** Update mock data to match playground ([8b61638](https://github.com/rolleyio/nuxt-directus-sdk/commit/8b61638))
- Add type contract tests for auth composable ([01de50a](https://github.com/rolleyio/nuxt-directus-sdk/commit/01de50a))
- Re-write known-issues-upstream with isolated schema ([1e24aa0](https://github.com/rolleyio/nuxt-directus-sdk/commit/1e24aa0))
- Add ficture infrastructure ([3fed1f1](https://github.com/rolleyio/nuxt-directus-sdk/commit/3fed1f1))
- Relocate fixtures and standardize mock-builder API ([fe69370](https://github.com/rolleyio/nuxt-directus-sdk/commit/fe69370))
- **auth:** Implement auth composable test suite ([1ff2590](https://github.com/rolleyio/nuxt-directus-sdk/commit/1ff2590))
- **rules:** Aligns fixtures and tests with directus `cms` sandbox template ([cff0c44](https://github.com/rolleyio/nuxt-directus-sdk/commit/cff0c44))
- **files:** Remove SDK alignment assertion (introduced in fba559b) ([f5c8a4e](https://github.com/rolleyio/nuxt-directus-sdk/commit/f5c8a4e))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>
- K Heiner <rolleyio@heiner.work>

## v6.0.0-beta.2

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v6.0.0-beta.1...v6.0.0-beta.2)

### 🚀 Enhancements

- Auto-import all functions from @directus/sdk dynamically ([79778d6](https://github.com/rolleyio/nuxt-directus-sdk/commit/79778d6))
- **playground:** Add visual editor ([a069eaf](https://github.com/rolleyio/nuxt-directus-sdk/commit/a069eaf))
- **playground:** Demo for visual editor and auto-import ([e14a356](https://github.com/rolleyio/nuxt-directus-sdk/commit/e14a356))
- **playground:** Add clarity on where configuration is necessary ([b26cddc](https://github.com/rolleyio/nuxt-directus-sdk/commit/b26cddc))

### 🔥 Performance

- **playground:** Add nav composable for consolidated presentation of playground features ([80a4af0](https://github.com/rolleyio/nuxt-directus-sdk/commit/80a4af0))

### 🩹 Fixes

- **playground:** Clean up todo's and improve styling ([94a7f19](https://github.com/rolleyio/nuxt-directus-sdk/commit/94a7f19))
- **playground:** Update useServerDirectus -> useSessionDirectus ([6adf36d](https://github.com/rolleyio/nuxt-directus-sdk/commit/6adf36d))
- **eslint:** Convert empty interfaces to type alias ([67dc680](https://github.com/rolleyio/nuxt-directus-sdk/commit/67dc680))
- **eslint:** Replace DiffChange<any> with imported types ([7372710](https://github.com/rolleyio/nuxt-directus-sdk/commit/7372710))
- **eslint:** Change cast of any to unknown in directus-visual-editor ([af21d88](https://github.com/rolleyio/nuxt-directus-sdk/commit/af21d88))
- **eslint:** Any to unknown in logger arguments and query param helper ([655299d](https://github.com/rolleyio/nuxt-directus-sdk/commit/655299d))
- **eslint:** Assign DirectusFileUpload data to Partial<...> ([d6f0838](https://github.com/rolleyio/nuxt-directus-sdk/commit/d6f0838))
- **eslint:** Change any to unknown in useState, setConfig mirrors type in config ([9b6e70c](https://github.com/rolleyio/nuxt-directus-sdk/commit/9b6e70c))
- **eslint:** Any to unknown ([8771510](https://github.com/rolleyio/nuxt-directus-sdk/commit/8771510))
- **eslint:** Options as any to FetchOptions for $fetch ([029313e](https://github.com/rolleyio/nuxt-directus-sdk/commit/029313e))
- **eslint:** Remove unnecessary cast as any in config ([c248774](https://github.com/rolleyio/nuxt-directus-sdk/commit/c248774))
- **rules:** Cast SDK response to locally defined Payload types ([f8153fb](https://github.com/rolleyio/nuxt-directus-sdk/commit/f8153fb))
- **rules:** Replace any with QueryFilter ([4ee9d73](https://github.com/rolleyio/nuxt-directus-sdk/commit/4ee9d73))
- **playground:** Replace any with proper types ([ad4b95f](https://github.com/rolleyio/nuxt-directus-sdk/commit/ad4b95f))
- **playground:** Replace any with explicitly defined types ([d76c7d5](https://github.com/rolleyio/nuxt-directus-sdk/commit/d76c7d5))
- **types:** Omit directus_* from DirectusSchema map ([#65](https://github.com/rolleyio/nuxt-directus-sdk/pull/65))
- **types:** Add directus_* collections to DirectusSchema as non-array values ([f85fd6f](https://github.com/rolleyio/nuxt-directus-sdk/commit/f85fd6f))
- **types:** Clean up workarounds made unnecessary by f85fd6f ([88153d1](https://github.com/rolleyio/nuxt-directus-sdk/commit/88153d1))
- **module:** Use loggerMessage for url warning and guard prod log on directusUrl ([d5ae65e](https://github.com/rolleyio/nuxt-directus-sdk/commit/d5ae65e))
- **auth:** Align DirectusAuth interface with implementation ([7897f6a](https://github.com/rolleyio/nuxt-directus-sdk/commit/7897f6a))

### 💅 Refactors

- Move discoverSdkImports to it's own file ([0e40f13](https://github.com/rolleyio/nuxt-directus-sdk/commit/0e40f13))
- Error as any switched to error as unknown ([233bed0](https://github.com/rolleyio/nuxt-directus-sdk/commit/233bed0))
- Remove casting as any from `$CURRENT_USER` in test ([4d13de3](https://github.com/rolleyio/nuxt-directus-sdk/commit/4d13de3))

### 📖 Documentation

- Update README development section for pnpm/corepack and contributing guidelines ([d4d5fa5](https://github.com/rolleyio/nuxt-directus-sdk/commit/d4d5fa5))
- Improve clarity on auto-import ([bcf7c54](https://github.com/rolleyio/nuxt-directus-sdk/commit/bcf7c54))

### 🌊 Types

- Remove any from files runtime composable and typegenerator ([36858a9](https://github.com/rolleyio/nuxt-directus-sdk/commit/36858a9))

### 🏡 Chore

- **ci:** Drop redundant prepack step from release workflow ([3d89af3](https://github.com/rolleyio/nuxt-directus-sdk/commit/3d89af3))
- Add PR template ([52e6d7e](https://github.com/rolleyio/nuxt-directus-sdk/commit/52e6d7e))
- **playground:** Switch to @nuxt/ui + Tailwind ([755add2](https://github.com/rolleyio/nuxt-directus-sdk/commit/755add2))
- Bump eslint ([c8e341e](https://github.com/rolleyio/nuxt-directus-sdk/commit/c8e341e))
- **eslint:** Global change to no-empty-object-type ([ded0db9](https://github.com/rolleyio/nuxt-directus-sdk/commit/ded0db9))
- **eslint:** Add eslint-disable for no-explicit-any that are intentional ([eb194d0](https://github.com/rolleyio/nuxt-directus-sdk/commit/eb194d0))

### ✅ Tests

- Add test for discoverSdkImports ([ad2492f](https://github.com/rolleyio/nuxt-directus-sdk/commit/ad2492f))
- **types:** Add known-issues-upstream test file & update generate-types test ([b99a899](https://github.com/rolleyio/nuxt-directus-sdk/commit/b99a899))

### 🎨 Styles

- Lint --fix ([c886bbf](https://github.com/rolleyio/nuxt-directus-sdk/commit/c886bbf))
- Standardize error varnames ([00e682b](https://github.com/rolleyio/nuxt-directus-sdk/commit/00e682b))

### ❤️ Contributors

- K Heiner <rolleyio@heiner.work>
- Matthew Rollinson <matt@rolley.io>
- Kevin Heiner <kheiner@gmail.com>

## v6.0.0-beta.1

[compare changes](https://github.com/rolleyio/nuxt-directus-sdk/compare/v6.0.0-beta.0...v6.0.0-beta.1)

### 🚀 Enhancements

- **cli:** Add generate-types subcommand ([1a261f2](https://github.com/rolleyio/nuxt-directus-sdk/commit/1a261f2))
- **types:** Add exclude option for generated types ([63a9e0b](https://github.com/rolleyio/nuxt-directus-sdk/commit/63a9e0b))
- **types:** Add include option, verbose rewrite warnings, and emit count ([fcd37c8](https://github.com/rolleyio/nuxt-directus-sdk/commit/fcd37c8))
- **types:** Expand include via references, fix --no-X flag parsing ([2cb33ea](https://github.com/rolleyio/nuxt-directus-sdk/commit/2cb33ea))
- **visual-editor:** ⚠️  Remove DirectusAddButton and DirectusEditButton ([51f313a](https://github.com/rolleyio/nuxt-directus-sdk/commit/51f313a))
- ⚠️  Rename useServerDirectus → useSessionDirectus ([79542a3](https://github.com/rolleyio/nuxt-directus-sdk/commit/79542a3))

### 🩹 Fixes

- **files:** Support uploading multiple files ([dc97745](https://github.com/rolleyio/nuxt-directus-sdk/commit/dc97745))

### 📖 Documentation

- Update development instructions for pnpm ([c887504](https://github.com/rolleyio/nuxt-directus-sdk/commit/c887504))
- Refresh README with current feature surface ([722ae31](https://github.com/rolleyio/nuxt-directus-sdk/commit/722ae31))
- **llms:** Slim and refresh for the new doc structure ([d53e257](https://github.com/rolleyio/nuxt-directus-sdk/commit/d53e257))
- Add CI and install-size badges to README ([cf468a6](https://github.com/rolleyio/nuxt-directus-sdk/commit/cf468a6))

### 🏡 Chore

- **pkg:** Add homepage, bugs, keywords and sharpen description ([7c32174](https://github.com/rolleyio/nuxt-directus-sdk/commit/7c32174))

### ✅ Tests

- Add test and mock data for files ([5d0aad8](https://github.com/rolleyio/nuxt-directus-sdk/commit/5d0aad8))

#### ⚠️ Breaking Changes

- **visual-editor:** ⚠️  Remove DirectusAddButton and DirectusEditButton ([51f313a](https://github.com/rolleyio/nuxt-directus-sdk/commit/51f313a))
- ⚠️  Rename useServerDirectus → useSessionDirectus ([79542a3](https://github.com/rolleyio/nuxt-directus-sdk/commit/79542a3))

### ❤️ Contributors

- Matthew Rollinson <matt@rolley.io>
- Kevin Heiner <kheiner@gmail.com>

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

