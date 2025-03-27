import type {
  Collection as DirectusCollection,
  Relation,
} from '@directus/types'
import type { Collections, Field, GenerateOptions } from './types'
import { authentication, createDirectus, readCollections, readFields, readRelations, rest } from '@directus/sdk'
import { useLogger } from '@nuxt/kit'

import { pascalCase } from 'change-case'

function warn(message: string) {
  useLogger('nuxt-directus-sdk').warn(message)
}

function joinTypes(types: string[]) {
  return types.map(x => `  ${x};`).join('\n')
}

// Previously used openapi-typescript but it wasn't flexible enough, this should work better?
// BASED ON: https://github.com/maltejur/directus-extension-generate-types
export async function generateTypes(options: GenerateOptions) {
  let types = ''
  const aliases: string[] = []

  const collections = await getCollections(options)

  Object.values(collections).forEach((collection) => {
    const name = collection.collection
    const typeName = name.startsWith('directus_') ? pascalCase(name) : pascalCase(`${options.prefix}${name}`)
    const isSingleton = collection.meta?.singleton === true

    types += `export type ${typeName} = {\n`
    collection.fields.forEach((field) => {
      if (field.meta?.interface?.startsWith('presentation-'))
        return

      types += '  '
      types += field.field.includes('-') ? `"${field.field}"` : field.field

      if (field.schema?.is_nullable)
        types += '?'

      types += ': '
      types += getType(field)
      types += ';\n'
    })
    types += '};\n\n'

    aliases.push(`${name}: ${typeName}${isSingleton ? '' : '[]'}`)
  })

  const allTypes = joinTypes(aliases)
  // Add directus_users to schemaTypes to ensure the types are valid when reading users etc
  // maybe other collections show be allowed through too
  // but it just populates the readItem type when you can't use read item to access them?
  const schemaTypes = joinTypes(aliases.filter((item) => {
    return item.startsWith('directus_users') || !item.startsWith('directus_')
  }))

  return `
  declare module '#app' {
    ${types.replaceAll('export type', 'type')}

    interface AllDirectusCollections {
      ${allTypes}
    };

    interface DirectusSchema {
      ${schemaTypes}
    };
  }
  
  declare global {
    ${types.replaceAll('export type', 'type')}

    interface AllDirectusCollections {
      ${allTypes}
    };

    interface DirectusSchema {
      ${schemaTypes}
    };
  }

  export {};
`
}

function getType(field: Field) {
  let type: string = ''

  if (field.relation) {
    type += field.relation.collection ? pascalCase(field.relation.collection) : 'any'
    if (field.relation.type === 'many')
      type += '[]'
  }
  else {
    if (['integer', 'bigInteger', 'float', 'decimal'].includes(field.type))
      type = 'number'
    else if (['boolean'].includes(field.type))
      type = 'boolean'
    else if (['json', 'csv'].includes(field.type))
      type = 'unknown'
    else type = 'string'
  }

  return type
}

async function getCollections(options: GenerateOptions) {
  const directus = createDirectus(options.url)
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  directus.setToken(options.token)

  const collections: Collections = {}

  try {
    const directusCollections = await directus.request(readCollections()) as DirectusCollection[] | null
    directusCollections?.sort((a, b) => a.collection.localeCompare(b.collection))
      .forEach((collection) => {
        collections[collection.collection] = { ...collection, fields: [] } as any
      })

    const fields = await directus.request(readFields()) as Field[] | null
    fields?.sort((a, b) => a.field.localeCompare(b.field))
      .forEach((field) => {
        if (!collections[field.collection]) {
          warn(`${field.collection} not found`)
          return
        }

        collections[field.collection].fields.push(field)

        if (collections[field.collection].fields.length === 0)
          delete collections[field.collection]
      })

    const relations = await directus.request(readRelations()) as Relation[] | null
    relations?.forEach((relation) => {
      if (!relation.meta) {
        warn(`Not yet implemented: Relation on field '${relation.field}' in collection '${relation.collection}' has no meta. Maybe missing a relation inside directus_relations table.`)
        return
      }

      if (!relation.meta.one_collection) {
        warn('Not yet implemented: Missing one collection')
        return
      }

      const oneField = collections[relation.meta.one_collection]?.fields.find(field => field.field === relation.meta!.one_field)
      const manyField = collections[relation.meta.many_collection]?.fields.find(field => field.field === relation.meta!.many_field)

      if (oneField) {
        oneField.relation = {
          type: 'many',
          collection: relation.meta.many_collection,
        }
      }

      if (manyField) {
        manyField.relation = {
          type: 'one',
          collection: relation.meta.one_collection,
        }
      }
    })
  }
  catch (error) {
    warn(`Failed to fetch collections: ${error}`)
  }

  return collections
}
