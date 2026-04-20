import { vi } from 'vitest'
import { readCollections } from './read-collections.data'
import { readFields } from './read-fields.data'
import { readRelations } from './read-relations.data'

export const requestMock = vi.fn()

// TBD: Do we need to mock specific versions, or will major version mocks work?
type DirectusMajorVersion = 'latest' | 'v11'

/**
 * Mocks Directus request behavior based on user role token.
 */
export function mockDirectusRequest() {
  return {
    directusVersion(version: DirectusMajorVersion) {
      requestMock.mockImplementation((query, token: 'admin' | 'not_admin' | 'empty') => {
        if (!token)
          token = 'empty' // Explicitly assign '', null, undefined -> 'empty'
        switch (version) {
          // NOTE: Always place newer versions on top.
          case 'latest':
          case 'v11':
            switch (query) {
              case 'readCollections':
                return readCollections[token as keyof typeof readCollections] ?? []
              case 'readFields':
                return readFields[token as keyof typeof readFields] ?? []
              case 'readRelations':
                return readRelations[token as keyof typeof readRelations] ?? []
            }
          // eslint-disable-next-line no-fallthrough
          default:
            throw new Error(`Function not implemented in mock.`)
        }
      })

      return this
    },
  }
}
