import type {
  Collection as DirectusCollection,
  Relation,
} from '@directus/types'
import type { Collections, Field, GenerateOptions } from './types'
import { createDirectus, readCollections, readFields, readRelations, rest, staticToken } from '@directus/sdk'
import { useLogger } from '@nuxt/kit'
import { pascalCase } from 'change-case'

const logger = useLogger('nuxt-directus-sdk')

function joinTypes(types: string[]) {
  return types.map(x => `  ${x};`).join('\n')
}

/**
 * Generate TypeScript types from Directus collections, fields, and relations
 * Uses @directus/sdk to fetch metadata directly - gives us proper optional/required detection
 */
export async function generateTypes(options: GenerateOptions) {
  let types = ''
  const aliases: string[] = []

  const collections = await getCollections(options)

  // Helper to get primary key type for a collection
  const getPrimaryKeyType = (collectionName: string): string => {
    const collection = collections[collectionName]
    if (!collection)
      return 'number | string'

    const pkField = collection.fields.find(f => f.field === 'id' || f.schema?.is_primary_key)
    if (!pkField)
      return 'number | string'

    // Use getType without relation handling to get the base type
    return getFieldType(pkField)
  }

  // Generate types with all fields for all collections
  Object.values(collections).forEach((collection) => {
    const name = collection.collection
    const isSystemCollection = name.startsWith('directus_')
    const typeName = isSystemCollection ? pascalCase(name) : pascalCase(`${options.prefix}${name}`)
    const isSingleton = collection.meta?.singleton === true

    types += `  interface ${typeName} {\n`
    collection.fields.forEach((field) => {
      // Skip presentation-only fields (they don't store data)
      if (field.meta?.interface?.startsWith('presentation-'))
        return

      types += '    '
      // Quote field names with hyphens or special characters
      types += field.field.includes('-') ? `"${field.field}"` : field.field

      // Key feature: proper optional/required detection from field schema
      // Field is optional if it's nullable AND not explicitly marked as required
      if (field.schema?.is_nullable && field.meta?.required !== true)
        types += '?'

      types += ': '
      types += getType(field, options.prefix, getPrimaryKeyType, options.unionIds ?? false)
      types += ';\n'
    })
    types += '  }\n\n'

    aliases.push(`${name}: ${typeName}${isSingleton ? '' : '[]'}`)
  })

  const schemaTypes = joinTypes(aliases)

  const customCollectionCount = Object.values(collections).filter(c => !c.collection.startsWith('directus_')).length
  const systemCollectionCount = Object.values(collections).length - customCollectionCount
  logger.info(`Generated types for ${customCollectionCount} custom collections and ${systemCollectionCount} system collections`)

  return `declare global {
${types}
  interface DirectusSchema {
${schemaTypes}
  }
}

export {};
`
}

/**
 * Get the TypeScript type for a field's base type (non-relation)
 */
function getFieldType(field: Field): string {
  let type: string = ''

  if (field.relation) {
    // For relations, return the likely FK type
    return 'number | string'
  }

  // Map Directus field types to TypeScript types
  // Based on TYPES from @directus/constants
  switch (field.type) {
    // Numeric types
    case 'integer':
    case 'bigInteger':
    case 'float':
    case 'decimal':
      type = 'number'
      break

    // Boolean type
    case 'boolean':
      type = 'boolean'
      break

    // Date/Time types (ISO 8601 strings)
    case 'date':
    case 'dateTime':
    case 'time':
    case 'timestamp':
      type = 'string'
      break

    // String types
    case 'string':
    case 'text':
    case 'uuid':
    case 'hash':
      type = 'string'
      break

    // Binary/Buffer type
    case 'binary':
      type = 'Buffer'
      break

    // JSON types
    case 'json':
    case 'csv':
      type = 'unknown'
      break

    // Geometry types
    case 'geometry':
    case 'geometry.Point':
    case 'geometry.LineString':
    case 'geometry.Polygon':
    case 'geometry.MultiPoint':
    case 'geometry.MultiLineString':
    case 'geometry.MultiPolygon':
      type = 'unknown' // GeoJSON, could be more specific if needed
      break

    // Special types
    case 'alias':
      type = 'any' // Alias fields don't store data
      break

    case 'unknown':
    default:
      type = 'unknown'
      break
  }

  return type
}

function getType(field: Field, prefix: string, getPrimaryKeyType: (collectionName: string) => string, unionIds: boolean): string {
  let type: string = ''

  if (field.relation) {
    const relatedCollection = field.relation.collection
    if (relatedCollection) {
      // Apply prefix logic: system collections (directus_*) don't get prefix, custom collections do
      const isSystemCollection = relatedCollection.startsWith('directus_')
      const relationType = isSystemCollection
        ? pascalCase(relatedCollection)
        : pascalCase(`${prefix}${relatedCollection}`)

      if (unionIds) {
        // Relations with union: number | RelatedType or number[] | RelatedType[]
        const pkType = getPrimaryKeyType(relatedCollection)
        if (field.relation.type === 'many') {
          type = `${pkType}[] | ${relationType}[]`
        }
        else {
          type = `${pkType} | ${relationType}`
        }
      }
      else {
        // Relations as full objects only: RelatedType or RelatedType[]
        if (field.relation.type === 'many') {
          type = `${relationType}[]`
        }
        else {
          type = relationType
        }
      }
    }
    else {
      type = 'any'
    }
  }
  else {
    type = getFieldType(field)
  }

  return type
}

async function getCollections(options: GenerateOptions) {
  // Create Directus client with REST API and static token authentication
  const directus = createDirectus(options.url)
    .with(staticToken(options.token))
    .with(rest())

  const collections: Collections = {}

  try {
    logger.info(`Fetching collections from: ${options.url}`)

    // Fetch all collections, fields, and relations in parallel for speed
    const [directusCollections, fields, relations] = await Promise.all([
      directus.request(readCollections()) as Promise<DirectusCollection[] | null>,
      directus.request(readFields()) as Promise<Field[] | null>,
      directus.request(readRelations()) as Promise<Relation[] | null>,
    ])

    // Build collections map
    directusCollections?.sort((a, b) => a.collection.localeCompare(b.collection))
      .forEach((collection) => {
        collections[collection.collection] = { ...collection, fields: [] } as any
      })

    // Map fields to collections
    fields?.sort((a, b) => a.field.localeCompare(b.field))
      .forEach((field) => {
        if (!collections[field.collection]) {
          logger.warn(`Collection ${field.collection} not found for field ${field.field}`)
          return
        }

        collections[field.collection]!.fields.push(field)

        if (collections[field.collection]!.fields.length === 0)
          delete collections[field.collection]
      })

    // Map relations to fields

    relations?.forEach((relation) => {
      if (!relation.meta) {
        // Skip relations without metadata
        return
      }

      if (!relation.meta.one_collection) {
        // Skip incomplete relations
        return
      }

      const oneField = collections[relation.meta.one_collection]?.fields.find(
        field => field.field === relation.meta!.one_field,
      )
      const manyField = collections[relation.meta.many_collection]?.fields.find(
        field => field.field === relation.meta!.many_field,
      )

      // Map one-to-many: one side gets array type
      if (oneField) {
        oneField.relation = {
          type: 'many',
          collection: relation.meta.many_collection,
        }
      }

      // Map many-to-one: many side gets single object type
      if (manyField) {
        manyField.relation = {
          type: 'one',
          collection: relation.meta.one_collection,
        }
      }
    })
  }
  catch (error) {
    logger.error(`Failed to fetch collections: ${error}`)
    throw error
  }

  return collections
}
