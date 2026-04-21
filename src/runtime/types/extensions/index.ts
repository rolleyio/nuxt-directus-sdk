import type { SnapshotField } from '@directus/types'
import { extension as seoPlugin } from './seo-plugin'

export interface TypegenExtension {
  name: (prefix?: string) => string
  isMatch: (field: SnapshotField) => boolean
  output: (prefix: string | undefined) => string
}

export const typegenExtensions: TypegenExtension[] = [
  seoPlugin,
]

/**
 * Resolve the first matching extension or false if no extension matches
 *
 */
export function resolveTypegenExtension(field: SnapshotField, prefix?: unknown): | { name: string, output: string } | false {
  const safePrefix = typeof prefix === 'string' ? prefix : ''
  const match = typegenExtensions.find(ext => ext.isMatch(field))
  if (!match) {
    return false
  }
  return {
    name: match.name(safePrefix),
    output: match.output(safePrefix),
  }
}
