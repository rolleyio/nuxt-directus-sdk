import type {
  Collection as DirectusCollection,
  Relation,
} from '@directus/shared/types'
import { useLogger } from '@nuxt/kit'

import { authentication, createDirectus, readCollections, readFields, readRelations, rest } from '@directus/sdk'
import type { Collections, Field } from './generate.types'

function warn(message: string) {
  useLogger(message)
}

export interface OASOptions {
  url: string
  token: string
}

// Previously used openapi-typescript but it wasn't flexible enough, this should work better?
// BASED ON: https://github.com/maltejur/directus-extension-generate-types
export async function generateTypes(options: OASOptions) {
  const collections = await getCollections(options)
  let typeValues = ''
  const types: string[] = []

  Object.values(collections).forEach((collection) => {
    const collectionName = collection.collection

    const typeName = pascalCase(collectionName)
    types.push(`${collectionName}: ${typeName}[]`)
    typeValues += `export type ${typeName} = {\n`

    collection.fields.forEach((field) => {
      if (field.meta?.interface?.startsWith('presentation-'))
        return

      typeValues += '  '
      typeValues += field.field.includes('-') ? `"${field.field}"` : field.field

      if (field.schema?.is_nullable)
        typeValues += '?'

      typeValues += ': '
      typeValues += getType(field)
      typeValues += ';\n'
    })
    typeValues += '};\n\n'
  })

  typeValues += `export interface AllCollections {\n${
     types.map(x => `  ${x};`).join('\n')
     }\n};

     interface UsersCollections {\n${
      types.filter(item => !item.startsWith('directus_')).map(x => `  ${x};`).join('\n')
      }\n};

     declare global {
      interface DirectusCollections {\n${
      types.filter(item => !item.startsWith('directus_')).map(x => `  ${x};`).join('\n')
      }\n};
    }     
`

  typeValues += '\n'

  return typeValues
}

function pascalCase(str: string) {
  return str
    .split(' ')
    .flatMap(x => x.split('_'))
    .flatMap(y => y.split('-'))
    .map(x => x.charAt(0).toUpperCase() + x.slice(1))
    .join('')
}

function getType(field: Field) {
  let type: string = ''

  if (field.relation && field.relation.type === 'many') {
    type = 'any[]'
  }
  else if (field.relation) {
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

  if (field.schema?.is_nullable) {
    if (field.relation)
      type = `${type} | null`

    else
      type += ' | null'
  }
  return type
}

export async function getCollections(options: OASOptions) {
  const directus = createDirectus(options.url)
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  directus.setToken(options.token)

  const rawCollections: DirectusCollection[] = await directus.request(readCollections()) as any
  const collections: Collections = {}
  rawCollections
    .sort((a, b) => a.collection.localeCompare(b.collection))
    .forEach(
      collection =>
        (collections[collection.collection] = { ...collection, fields: [] }),
    )

  const fields: Field[] = await directus.request(readFields()) as any
  fields.sort((a, b) => a.field.localeCompare(b.field))
    .forEach((field) => {
      if (!collections[field.collection]) {
        warn(`${field.collection} not found`)
        return
      }
      collections[field.collection].fields.push(field)

      if (collections[field.collection].fields.length === 0)
        delete collections[field.collection]
    })

  const relations: Relation[] = await directus.request(readRelations()) as any

  relations.forEach((relation) => {
    if (!relation.meta) {
      warn(`Relation on field '${relation.field}' in collection '${relation.collection}' has no meta. Maybe missing a relation inside directus_relations table.`)
      return
    }

    if (!relation.meta.one_collection) {
      warn('No one collection')
      return
    }

    const oneField = collections[relation.meta.one_collection]?.fields.find(
      field => field.field === relation.meta!.one_field,
    )

    const manyField = collections[relation.meta.many_collection]?.fields.find(
      field => field.field === relation.meta!.many_field,
    )

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

  return collections
}
