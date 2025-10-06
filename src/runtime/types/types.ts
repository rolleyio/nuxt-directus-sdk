import type {
  Collection as DirectusCollection,
  Field as DirectusField,
} from '@directus/types'

export type Field = DirectusField & {
  relation?: {
    type: 'many' | 'one'
    collection: string
  }
}

export type Collection = DirectusCollection & { fields: Field[] }
export interface Collections { [collection: string]: Collection }

export interface GenerateOptions {
  url: string
  token: string
  prefix: string
  unionIds?: boolean // If true, relations are typed as "number | RelatedType", otherwise just "RelatedType" (default: false)
}
