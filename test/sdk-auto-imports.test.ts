import * as sdkModule from '@directus/sdk'
import { describe, expect, it } from 'vitest'
import { discoverSdkImports, SDK_COMPOSABLE_WRAPPED, SDK_DENYLIST } from '../src/sdk-imports'

const sdkFunctions = new Set(
  // TODO: (eslint) revisit any types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.keys(sdkModule).filter(key => typeof (sdkModule as any)[key] === 'function'),
)

describe('ensure SDK_COMPOSABLE_WRAPPED stays in sync with @directus/sdk', () => {
  it('every entry exists as a function in @directus/sdk', () => {
    // If this fails, the SDK renamed or removed a wrapped function.
    // Update SDK_COMPOSABLE_WRAPPED in src/sdk-imports.ts and the denylist table in docs/api/composables/index.md.
    const missing = [...SDK_COMPOSABLE_WRAPPED].filter(fn => !sdkFunctions.has(fn))
    expect(missing).toEqual([])
  })
})

describe('ensure SDK_DENYLIST stays in sync with @directus/sdk', () => {
  it('every entry exists as a function in @directus/sdk', () => {
    // If this fails, the SDK renamed or removed a blocked function.
    // A renamed function would slip through the denylist as a new auto-import.
    // Review sdk-imports.ts and update the relevant set.
    const missing = [...SDK_DENYLIST].filter(fn => !sdkFunctions.has(fn))
    expect(missing).toEqual([])
  })
})

describe('discoverSdkImports', () => {
  it('excludes all denylist entries', () => {
    // If this fails, a blocked function is leaking into auto-imports.
    // Add the leaking name to the appropriate set in src/sdk-imports.ts.
    // TODO: (eslint) revisit any types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imports = discoverSdkImports(sdkModule as any)
    const leaked = imports.filter(fn => SDK_DENYLIST.has(fn))
    expect(leaked).toEqual([])
  })

  it('contains only functions that exist in @directus/sdk', () => {
    // If this fails, discoverSdkImports is returning a name that is not a function in the SDK.
    // Check the filter logic in src/sdk-imports.ts.
    // TODO: (eslint) revisit any types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imports = discoverSdkImports(sdkModule as any)
    const unknown = imports.filter(fn => !sdkFunctions.has(fn))
    expect(unknown).toEqual([])
  })

  it('returns a non-empty list of importable functions', () => {
    // If this fails, discoverSdkImports is filtering out everything.
    // Check that SDK_DENYLIST in src/sdk-imports.ts has not grown to cover all SDK exports.
    // TODO: (eslint) revisit any types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imports = discoverSdkImports(sdkModule as any)
    expect(imports.length).toBeGreaterThan(0)
  })

  it('respects userExclude', () => {
    // If this fails, discoverSdkImports is ignoring the userExclude parameter.
    // Check the filter logic in src/sdk-imports.ts.
    const userExclude = new Set(['aggregate', 'withToken'])
    // TODO: (eslint) revisit any types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imports = discoverSdkImports(sdkModule as any, userExclude)
    expect(imports).not.toContain('aggregate')
    expect(imports).not.toContain('withToken')
  })
})
