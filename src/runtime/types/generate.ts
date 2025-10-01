import type { GenerateOptions } from './types'
import { useLogger } from '@nuxt/kit'
import { pascalCase } from 'change-case'
import openapiTS, { astToString } from 'openapi-typescript'
import { joinURL } from 'ufo'

const logger = useLogger('nuxt-directus-sdk')

/**
 * Generate TypeScript types from Directus OpenAPI spec
 * Fetches the OAS from Directus and uses openapi-typescript for accurate type generation
 */
export async function generateTypes(options: GenerateOptions) {
  try {
    const oasUrl = joinURL(options.url, 'server/specs/oas')

    logger.info(`Fetching OpenAPI spec from: ${oasUrl}`)

    // Fetch the OpenAPI spec from Directus using admin token
    const response = await fetch(oasUrl, {
      headers: {
        Authorization: `Bearer ${options.token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch OAS: ${response.status} ${response.statusText}`)
    }

    const oasSpec = await response.json()

    logger.info('Generating TypeScript types from OpenAPI spec')

    // Generate TypeScript types from the OAS
    const ast = await openapiTS(oasSpec, {
      exportType: true,
    })

    // Convert AST to string
    const openapiTypes = astToString(ast)

    // Parse the OpenAPI output to extract collection information
    const collections = parseCollectionsFromOpenAPI(openapiTypes, options.prefix)

    // Build the Directus-specific interfaces using the generated types
    return buildDirectusInterfaces(collections, openapiTypes)
  }
  catch (error) {
    logger.error(`Failed to generate types from OpenAPI spec: ${error}`)
    throw error
  }
}

interface CollectionInfo {
  name: string // Database name (e.g., 'products', 'directus_users')
  typeName: string // TypeScript type name (e.g., 'Products', 'DirectusUsers')
  openapiTypeName: string // OpenAPI schema name (e.g., 'ItemsProducts')
  isSingleton: boolean
}

function parseCollectionsFromOpenAPI(openapiTypes: string, prefix: string): CollectionInfo[] {
  const collections: CollectionInfo[] = []

  // OpenAPI generates components['schemas']['Items*'] types
  // We need to find all schema keys that start with "Items"
  // Pattern: "ItemsCategories": { ... } or ItemsCategories?: { ... }
  const schemaRegex = /"?(Items[A-Z]\w*)"?\s*\??:\s*\{/g

  const seen = new Set<string>()
  const matches = openapiTypes.matchAll(schemaRegex)

  for (const match of matches) {
    const openapiTypeName = match[1]

    // Skip if no match or duplicates
    if (!openapiTypeName || seen.has(openapiTypeName) || !openapiTypeName.startsWith('Items')) {
      continue
    }
    seen.add(openapiTypeName)

    // Extract collection name: ItemsCategories -> Categories -> categories
    const rawName = openapiTypeName.slice(5) // Remove "Items" prefix

    // Convert PascalCase to snake_case for database name
    const dbName = rawName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')

    const isDirectusCollection = dbName.startsWith('directus_')

    // Apply prefix for custom collections only
    const finalTypeName = isDirectusCollection
      ? pascalCase(dbName)
      : pascalCase(`${prefix}${dbName}`)

    collections.push({
      name: dbName,
      typeName: finalTypeName,
      openapiTypeName,
      isSingleton: false, // Could be enhanced by checking collection meta
    })
  }

  logger.info(`Found ${collections.length} collections`)
  return collections
}

function buildDirectusInterfaces(collections: CollectionInfo[], openapiTypes: string): string {
  let typeAliases = `
  type DirectusUsers = components['schemas']['Users'];
  type DirectusFiles = components['schemas']['Files'];
`
  const allCollections: string[] = []
  const schemaCollections: string[] = []

  collections.forEach(({ name, typeName, openapiTypeName, isSingleton }) => {
    // Create type alias from OpenAPI generated type
    typeAliases += `  type ${typeName} = components['schemas']['${openapiTypeName}'];\n`

    // Add to collections list
    const collectionType = `    ${name}: ${typeName}${isSingleton ? '' : '[]'}`
    allCollections.push(collectionType)

    // Add directus_users to schemaTypes to ensure the types are valid when reading users etc
    // Other directus_ collections are excluded as they can't be used with readItems
    if (!name.startsWith('directus_')) {
      schemaCollections.push(collectionType)
    }
  })

  const allTypes = allCollections.join(';\n')
  const schemaTypes = schemaCollections.join(';\n')

  // Return both the OpenAPI types and the Directus-specific interfaces
  return `${openapiTypes}

declare global {
${typeAliases}
  interface AllDirectusCollections {
${allTypes};
  }

  interface DirectusSchema {
${schemaTypes};
  }
}

export {};
`
}
