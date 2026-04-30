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
