import { vi } from 'vitest'
import type { DirectusMajorVersion } from './versions'
import { readCollections } from './read-collections.data'
import { readFields } from './read-fields.data'
import { readRelations } from './read-relations.data'

export const requestMock = vi.fn()

export function mockDirectusRequest() {
  return {
    withVersion(version: DirectusMajorVersion) {
      requestMock.mockImplementation((query, token: 'admin' | 'not_admin' | 'empty') => {
        if (!token)
          token = 'empty' // Explicitly assign '', null, undefined -> 'empty'
        switch (version) {
          // NOTE: Always place newer versions on top.
          // Queries not handled by a newer version's inner switch fall through
          // to the next case, inheriting the older version's behavior.
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
