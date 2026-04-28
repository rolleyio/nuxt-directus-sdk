# Test Suite Guide

This document explains how to work with the nuxt-directus-sdk test suite: how to run tests, how the mock system works, and how to add new tests when the module gains new features.

---

## Test Types

| Extension | Runner | Purpose |
|-----------|--------|---------|
| `.test.ts` | Vitest (runtime) | Unit and integration tests |
| `.test-d.ts` | `vue-tsc` (type-check) | Type-level contract tests via `expectTypeOf` |

Type tests verify the **public API shape** and will catch regressions when refactoring composable signatures. Runtime tests verify **behaviour** of the composable to demonstrate the output with a mocked response from the directus/sdk.

---

## Running Tests

```sh
# Run all tests once
pnpm test

# Watch mode
pnpm test:watch

# Run only the default project (excludes server/client url-helper projects)
pnpm test --project default

# Run a specific file
pnpm test test/auth.test.ts

# Verbose output (shows each individual test result)
pnpm test --reporter=verbose
```

The vitest config (`vitest.config.ts`) defines three projects:

- **default**  all tests except url-helpers, with type-checking for `.test-d.ts` files
- **server**  `url-helpers.server.test.ts` with `import.meta.server = true`
- **client**  `url-helpers.client.test.ts` with `import.meta.client = true`

---

## Mock Architecture

> **One mock file per SDK surface, sharing `*.data.ts` fixtures.**

### Naming conventions

| File pattern | Role |
|---|---|
| `fixtures/directus-sdk/*.data.ts` | Raw fixture data (plain objects/arrays) |
| `fixtures/directus-sdk/*.mock.ts` | Builder factory + `vi.fn()` exports |
| `fixtures/directus-sdk/versions.ts` | Shared `DirectusMajorVersion` type - single source of truth for supported versions |
| `fixtures/nuxt/*.data.ts` | Nuxt runtime config shapes |
| `fixtures/nuxt/composables.mock.ts` | Stubs for Nuxt composables (`useState`, `navigateTo`, etc.) |

Mock files are named after what they mock, not how they work:

| Mock file | SDK surface covered |
|---|---|
| `auth.mock.ts` | `login`, `logout`, `readMe`, user management |
| `upload-files.mock.ts` | `uploadFiles()` + follow-up `request()` for file metadata |
| `schema-introspection.mock.ts` | `readCollections`, `readFields`, `readRelations` (used by `generate-types`) |

### The builder pattern

Each mock file exports:
1. **`vi.fn()` instances** are imported at the top of the test file so tests can configure and inspect them
2. **A `mock<Name>()` builder** with a `.withVersion(v)` method that sets up happy-path defaults

```ts
// In a test file:
import { requestMock, mockDirectusAuth } from './fixtures/directus-sdk/auth.mock'

beforeEach(() => {
  requestMock.mockReset()
})

it('example', async () => {
  mockDirectusAuth().withVersion('latest') // sets up defaults
  requestMock.mockResolvedValueOnce(overrideData) // override for this test

  // test body...
})
```

### Choosing a mock pattern

Two patterns coexist in the suite - they are not alternatives for the same situation:

**Pattern A - Chained routing** (`schema-introspection.mock.ts`, used by `generate-types.test.ts`)

Use when all composable calls flow through a single `directus.request()` entry point AND a single test execution calls `request()` with multiple different queries that each need different fixture responses.

Mechanism: SDK query factory functions are mocked to return **string identifiers** instead of real query objects. Those strings flow through `directus.request(query)` into the mock's implementation, which switches on them to return the right fixture data.

```ts
// vi.mock('@directus/sdk') factory:
readCollections: vi.fn(() => 'readCollections'),
readFields: vi.fn(() => 'readFields'),

// schema-introspection.mock.ts:
requestMock.mockImplementation((query, token) => {
  switch (query) {
    case 'readCollections': return readCollections[token] ?? []
    case 'readFields': return readFields[token] ?? []
  }
})

// In the test - one call configures all routing:
mockDirectusRequest().withVersion('latest')
```

**Pattern B - Explicit per-surface mocks** (`auth.mock.ts`, used by `auth.test.ts`)

Use when the composable has a mixed API surface - some calls are direct SDK methods (`login()`, `logout()`) that do not go through `request()` at all, some are `request()`-wrapped SDK factories - AND tests need to assert on specific function arguments or inject failures at specific boundaries.

```ts
// Exported spies - tests configure and assert individually:
export const loginMock = vi.fn()
export const logoutMock = vi.fn()
export const requestMock = vi.fn()

// Builder sets happy-path defaults:
mockDirectusAuth().withVersion('latest')

// Test overrides exactly one boundary:
logoutMock.mockRejectedValue(new Error('session expired'))
// requestMock is unaffected - the test verifies the composable clears user state despite the error
```

**Quick guide:**

| Question | If yes → |
|---|---|
| Do ALL SDK calls go through `request()`? | Pattern A is viable |
| Does a single test execution need `request()` to return different data per query? | Pattern A is required |
| Does the composable call `login()`, `logout()`, or other direct client methods? | Pattern B |
| Do tests need to assert on specific SDK function arguments? | Pattern B |
| Do tests need to inject failures at one specific SDK boundary only? | Pattern B |

---

### When to use `vi.mock()` vs `vi.doMock()`

- **`vi.mock()` (static)**  default. Use when the mock behaviour is the same for all tests in a file. The mock is registered at module-load time.
- **`vi.doMock()` (dynamic)**  use only when tests in the same file need different module-level values. The url-helpers tests use this because each test group configures a different `useRuntimeConfig` return value.

---

## Adding a New Composable Test

**Scenario**: a new `useDirectusMedia` composable is added at `src/runtime/composables/media.ts`.

### Step 1  Add fixture data

Create `test/fixtures/directus-sdk/media.data.ts`:
```ts
export const mockMediaItem = {
  id: 'media-uuid-1',
  title: 'Example Image',
  // ...
}
```

### Step 2  Add a mock file

Create `test/fixtures/directus-sdk/media.mock.ts`:
```ts
import { vi } from 'vitest'
import type { DirectusMajorVersion } from './versions'
import { mockMediaItem } from './media.data'

export const requestMock = vi.fn()

export function mockDirectusMedia() {
  return {
    withVersion(version: DirectusMajorVersion) {
      switch (version) {
        case 'latest':
        case 'v11':
          requestMock.mockResolvedValue(mockMediaItem)
          break
        default:
          throw new Error(`Function not implemented in mock.`)
      }
      return this
    },
  }
}
```

### Step 3  Write the test file

Create `test/media.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMediaItem } from './fixtures/directus-sdk/media.data'
import { mockDirectusMedia, requestMock } from './fixtures/directus-sdk/media.mock'
import { useDirectusMedia } from '../src/runtime/composables/media'

vi.mock('../src/runtime/composables/directus', async () => {
  const { requestMock } = await import('./fixtures/directus-sdk/media.mock')
  return {
    useDirectus: vi.fn(() => ({ request: requestMock })),
    useDirectusUrl: vi.fn((path = '') => `https://cms.example.com${path}`),
  }
})

beforeEach(() => {
  requestMock.mockReset()
})

describe('useDirectusMedia', () => {
  it('...', async () => {
    mockDirectusMedia().withVersion('latest')
    // test body
  })
})
```

### Step 4 (optional) - Add a type test

Create `test/media.test-d.ts`:
```ts
import { describe, expectTypeOf, it } from 'vitest'
import type { MediaItem } from '../src/runtime/composables/media'
import { useDirectusMedia } from '../src/runtime/composables/media'

describe('useDirectusMedia', () => {
  it('returns Promise<MediaItem>', () => {
    expectTypeOf(useDirectusMedia).returns.resolves.toEqualTypeOf<MediaItem>()
  })
})
```

---

## Adding a New Directus Version

> [!IMPORTANT]
> Users should not have the expectation that old versions of Directus will maintain support as the module develops. The testing suite considers versions to better identify issues caused by the module and issues caused by users on old versions of Directus.

When a new major version of Directus ships, the workflow is:

**1. Add the version to `versions.ts`**  this is the single source of truth:

```ts
// fixtures/directus-sdk/versions.ts
export type DirectusMajorVersion = 'latest' | 'v12' | 'v11'
//                                              ^^^^^ add here
```

TypeScript will immediately flag every `withVersion()` switch statement that doesn't handle the new case, pointing you to exactly which mocks need updating.

**2. Extend `withVersion()` in each affected mock** - if the new version has the same response shapes as the previous, a fallthrough is enough:

```ts
export function mockDirectusAuth() {
  return {
    withVersion(version: DirectusMajorVersion) {
      switch (version) {
        case 'latest':   // ← alias for the newest version
        case 'v12':      // ← new version
        case 'v11':
          requestMock.mockResolvedValue(mockUser)
          break
        // ...
      }
    },
  }
}
```

**3. If the new version changes response shapes**, add a versioned fixture:

```ts
// auth.data.ts
export const mockUserV12 = { id: '...', /* new shape */ }
```

Then branch the data in the `withVersion()` switch for that mock.

> [!TIP] 
> When a user reports a bug, the version they're running will usually narrow down which `case` branch applies - or reveal that a case is missing entirely. Adding `v12` to `versions.ts` first makes TypeScript do the audit for you.

---

## About `known-issues-upstream.test-d.ts`

This file contains intentional type tests that document **known bugs in `@directus/sdk`**. Each test has a `[delete when fixed]` note. When the upstream bug is fixed, the test should be deleted (not updated). The test suite will catch this because the test will start failing once the bug is resolved.
