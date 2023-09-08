import { snakeCase } from 'change-case'
import { authentication, createDirectus, readOpenApiSpec, rest } from '@directus/sdk'

import type { GenerateTypeOptions, SchemaProperty, SchemaPropertyOneOf, SchemaPropertyOneOfReference, SchemaPropertySingle, SchemaPropertyType, SchemasRecord } from './types'

export function mapPropertyType(propertyType: SchemaPropertyType) {
  return propertyType === 'integer' ? 'number' : propertyType
}

export function processOneOfProperty(schemas: SchemasRecord, name: string, property: SchemaPropertyOneOf): string | undefined {
  const ref = property.oneOf.find((item) => {
    return '$ref' in item
  })

  if (ref) {
    const $ref = (ref as SchemaPropertyOneOfReference).$ref

    const $refKey = $ref.split('/').pop()

    if ($refKey) {
      const $refSchema = `DirectusCollections['${schemas[$refKey]?.['x-collection']}']`

      if ($refSchema)
        return $refSchema
    }
  }

  const firstValue = property.oneOf?.[0] as unknown as SchemaPropertySingle

  if ('type' in firstValue) {
    const firstType = mapPropertyType(firstValue.type!)

    if (firstType)
      return firstType
  }

  console.error('Unknown schema for oneOf', name, property)

  return ''
}

export function processProperty(schemas: SchemasRecord, name: string, property: SchemaProperty): string | undefined {
  if ('type' in property) {
    if (property.type === 'array' && property.items) {
      if (!property.items.oneOf)
        return processProperty(schemas, name, property.items)

      return `
      "${name}": ${processOneOfProperty(schemas, name, property.items)};
    `
    }
    else {
      return `
      ${property.format ? `/* ${property.format} */` : ''}
      "${name}": ${mapPropertyType(property.type ?? 'string')};
    `
    }
  }
  else if ('oneOf' in property) {
    const value = processOneOfProperty(schemas, name, property)

    if (!value)
      return

    const simpleTypes = ['string', 'number', 'boolean']
    const valueType = simpleTypes.includes(value) ? value : `Single<${value}>`

    return `
      "${name}": ${valueType};
    `
  }

  // Debug
  // console.log('Unknown property type', name, property)
}

export async function generateTypes(options: GenerateTypeOptions): Promise<string> {
  const directus = createDirectus(options.url)
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  directus.setToken(options.token)

  const data = await directus.request(readOpenApiSpec())
  const types: string[] = []

  const schemas = data.components.schemas as SchemasRecord

  const schemaNames: string[] = []

  Object.entries(schemas).forEach(([_, schema]) => {
    const schemaName = schema['x-collection']

    if (!schemaName)
      return

    if (schema.type !== 'object') {
      console.error(schemaName, 'is not an object')
      return
    }

    if (schemaNames.includes(schemaName))
      return

    schemaNames.push(schemaName)

    const properties: string[] = []

    Object.entries(schema.properties).forEach(([name, property]) => {
      const propertyType = processProperty(schemas, name, property)

      if (propertyType)
        properties.push(propertyType.trim())
    })

    types.push(`${snakeCase(schemaName)}: {
      ${properties.join('\n')}
    }[];\n`)
  })

  const exportProperties = types.join('\n')

  return `
  export type Single<T extends any[]> = T extends (infer U)[] ? U : never;

  export type DirectusCollections = {
    ${exportProperties}
  };

  export type DirectusCollectionUser = Single<DirectusCollections['directus_users']>;

declare global {
  type Single = Single
  type DirectusCollections = DirectusCollections
  type DirectusCollectionUser = DirectusCollectionUser
}

  export {};
`
}
