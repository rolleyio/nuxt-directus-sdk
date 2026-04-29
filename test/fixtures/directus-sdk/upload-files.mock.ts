import { vi } from 'vitest'
import type { DirectusMajorVersion } from './versions'
import { readFiles } from './read-files.data'

export const requestMock = vi.fn()
export const uploadFilesMock = vi.fn()
export const state = { capturedFormData: null as FormData | null }

export function mockDirectusUpload() {
  return {
    withVersion(version: DirectusMajorVersion) {
      switch (version) {
        // NOTE: Always place newer versions on top.
        // Queries not handled by a newer version's inner switch fall through
        // to the next case, inheriting the older version's behavior.
        case 'latest':
        case 'v11':
          uploadFilesMock.mockImplementation((fd: FormData) => {
            state.capturedFormData = fd
            return {}
          })
          requestMock.mockResolvedValue(readFiles.admin)
          break
        default:
          throw new Error(`Function not implemented in mock.`)
      }
      return this
    },
  }
}
