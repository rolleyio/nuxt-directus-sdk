import type { DirectusFile as SdkDirectusFile } from '@directus/sdk'
import { describe, expectTypeOf, it } from 'vitest'
import { getDirectusFileUrl, uploadDirectusFile } from '../src/runtime/composables/files'

describe('getDirectusFileUrl', () => {
  it('returns string', () => {
    expectTypeOf(getDirectusFileUrl).returns.toEqualTypeOf<string>()
  })

  it('first parameter accepts string or DirectusFile', () => {
    expectTypeOf(getDirectusFileUrl).parameter(0).toEqualTypeOf<string | DirectusFile>()
  })
})

describe('uploadDirectusFile', () => {
  it('returns Promise<DirectusFile>', () => {
    expectTypeOf(uploadDirectusFile).returns.resolves.toEqualTypeOf<DirectusFile>()
  })
})

describe('DirectusFile SDK alignment', () => {
  // Verifies that the string-scalar fields declared in fallback.d.ts still
  // exist in the SDK's DirectusFile with compatible types. If the SDK renames
  // or removes one of these fields the Pick in fallback.d.ts will error first,
  // but this test makes the contract explicit and visible.
  // See: https://github.com/rolleyio/nuxt-directus-sdk/pull/78#issuecomment-4346891162
  it('fallback string fields are a subset of the SDK type', () => {
    type FallbackStringFields = Partial<Pick<SdkDirectusFile<object>,
      | 'title'
      | 'description'
      | 'location'
      | 'type'
      | 'charset'
      | 'storage'
      | 'filename_disk'
      | 'filename_download'
    >>
    expectTypeOf<DirectusFile>().toMatchTypeOf<FallbackStringFields>()
  })
})
