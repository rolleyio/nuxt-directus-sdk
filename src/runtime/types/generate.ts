import type { GenerateOptions } from './types'
import { useLogger } from '@nuxt/kit'
import { pascalCase } from 'change-case'
import openapiTS, { astToString } from 'openapi-typescript'
import { joinURL } from 'ufo'

const logger = useLogger('nuxt-directus-sdk')

/**
 * Extract only the components.schemas section from OpenAPI types
 * This dramatically reduces file size by removing paths and operations
 */
function extractSchemasOnly(openapiTypes: string): string | null {
  // Find where components starts (can be "export type components" or "export interface components")
  const componentsStartMatch = openapiTypes.match(/export (type|interface) components\s*(?:=\s*)?\{/)
  if (!componentsStartMatch) {
    return null
  }

  const componentsStart = componentsStartMatch.index!
  const isType = componentsStartMatch[1] === 'type'

  // Find the schemas section within components
  const schemasPattern = /schemas:\s*\{/
  const schemasMatch = openapiTypes.slice(componentsStart).match(schemasPattern)
  if (!schemasMatch || schemasMatch.index === undefined) {
    return null
  }

  const schemasStart = componentsStart + schemasMatch.index

  // Find the end of schemas by counting braces
  let braceCount = 0
  let schemasEnd = schemasStart
  let inSchemas = false

  for (let i = schemasStart; i < openapiTypes.length; i++) {
    const char = openapiTypes[i]
    if (char === '{') {
      braceCount++
      inSchemas = true
    }
    else if (char === '}') {
      braceCount--
      if (inSchemas && braceCount === 0) {
        schemasEnd = i + 1
        break
      }
    }
  }

  const schemasContent = openapiTypes.slice(schemasStart, schemasEnd)

  // Rebuild minimal components with only schemas
  if (isType) {
    return `export type components = {
  ${schemasContent}
};`
  }
  else {
    return `export interface components {
  ${schemasContent}
}`
  }
}

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
    const fullOpenapiTypes = astToString(ast)

    // Extract only the components.schemas part to reduce file size
    const schemasOnly = extractSchemasOnly(fullOpenapiTypes)
    const openapiTypes = schemasOnly || fullOpenapiTypes // Fallback to full if extraction fails

    // Parse the OpenAPI output to extract collection information
    // Use full types for parsing (need operations for singleton detection)
    const collections = parseCollectionsFromOpenAPI(fullOpenapiTypes, options.prefix)

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
  const seen = new Set<string>()

  // Pattern 1: Custom collections - components['schemas']['Items*']
  const itemsRegex = /"?(Items[A-Z]\w*)"?\s*\??:\s*\{/g
  const itemsMatches = openapiTypes.matchAll(itemsRegex)

  for (const match of itemsMatches) {
    const openapiTypeName = match[1]

    if (!openapiTypeName || seen.has(openapiTypeName)) {
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

    // Detect singletons: check if readItems operation returns non-array
    // Pattern for singleton: readItemsSettings: { ... responses: { ... data?: components["schemas"]["ItemsSettings"]; ... } }
    // Pattern for regular: readItemsCards: { ... responses: { ... data?: components["schemas"]["ItemsCards"][]; ... } }
    const operationName = `readItems${rawName}`
    // Look for the response data type within the specific operation
    // Match: data?: components["schemas"]["ItemsSettings"];
    // Don't match: data?: components["schemas"]["ItemsCards"][];
    const operationPattern = new RegExp(
      `${operationName}:[\\s\\S]{1,2000}?data\\?:\\s*components\\["schemas"\\]\\["${openapiTypeName}"\\];`,
      ''
    )
    const isSingleton = operationPattern.test(openapiTypes)

    collections.push({
      name: dbName,
      typeName: finalTypeName,
      openapiTypeName,
      isSingleton,
    })
  }

  // Pattern 2: System collections - components['schemas']['Users'], components['schemas']['Roles'], etc.
  // These don't have the "Items" prefix and map directly to directus_* collections
  const systemSchemas = [
    { schema: 'Users', collection: 'directus_users' },
    { schema: 'Files', collection: 'directus_files' },
    { schema: 'Roles', collection: 'directus_roles' },
    { schema: 'Folders', collection: 'directus_folders' },
    { schema: 'Activity', collection: 'directus_activity' },
    { schema: 'Collections', collection: 'directus_collections' },
    { schema: 'Fields', collection: 'directus_fields' },
    { schema: 'Permissions', collection: 'directus_permissions' },
    { schema: 'Presets', collection: 'directus_presets' },
    { schema: 'Relations', collection: 'directus_relations' },
    { schema: 'Revisions', collection: 'directus_revisions' },
    { schema: 'Settings', collection: 'directus_settings' },
    { schema: 'Webhooks', collection: 'directus_webhooks' },
    { schema: 'Flows', collection: 'directus_flows' },
    { schema: 'Operations', collection: 'directus_operations' },
    { schema: 'Dashboards', collection: 'directus_dashboards' },
    { schema: 'Panels', collection: 'directus_panels' },
    { schema: 'Notifications', collection: 'directus_notifications' },
    { schema: 'Shares', collection: 'directus_shares' },
    { schema: 'Translations', collection: 'directus_translations' },
    { schema: 'Versions', collection: 'directus_versions' },
    { schema: 'Extensions', collection: 'directus_extensions' },
    { schema: 'Policies', collection: 'directus_policies' },
    { schema: 'Access', collection: 'directus_access' },
  ]

  for (const { schema, collection } of systemSchemas) {
    // Match both quoted and unquoted schema keys: "Roles": { or Roles: {
    const schemaPattern = new RegExp(`["']?${schema}["']?\\s*:\\s*\\{`, 'g')
    if (schemaPattern.test(openapiTypes) && !seen.has(schema)) {
      seen.add(schema)
      collections.push({
        name: collection,
        typeName: pascalCase(collection),
        openapiTypeName: schema,
        isSingleton: collection === 'directus_settings',
      })
    }
  }

  const customCollections = collections.filter(c => !c.name.startsWith('directus_'))
  logger.info(`Found ${customCollections.length} custom collections and ${collections.length - customCollections.length} system collections`)
  return collections
}

function buildDirectusInterfaces(collections: CollectionInfo[], openapiTypes: string): string {
  // Transform the OpenAPI types to remove union types from relation fields
  const transformedTypes = transformRelationFields(openapiTypes)

  // Build type aliases and collection interfaces
  let typeAliases = '\n'
  const allCollections: string[] = []
  const schemaCollections: string[] = []

  collections.forEach(({ name, typeName, openapiTypeName, isSingleton }) => {
    // Create type alias from OpenAPI generated type
    typeAliases += `  type ${typeName} = components['schemas']['${openapiTypeName}'];\n`

    // Add to AllDirectusCollections - includes ALL collections (custom + system)
    const collectionType = `    ${name}: ${typeName}${isSingleton ? '' : '[]'}`
    allCollections.push(collectionType)

    // Add to DirectusSchema - only collections that can be used with readItems
    // Include: custom collections, directus_users, directus_files
    // Exclude: other system collections (directus_activity, directus_roles, etc.)
    const isReadableSystemCollection = name === 'directus_users' || name === 'directus_files'
    const isCustomCollection = !name.startsWith('directus_')

    if (isReadableSystemCollection || isCustomCollection) {
      schemaCollections.push(collectionType)
    }
  })

  const allTypes = allCollections.join(';\n')
  const schemaTypes = schemaCollections.join(';\n')

  // Return both the OpenAPI types and the Directus-specific interfaces
  return `${transformedTypes}

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

/**
 * Transform relation fields to remove union types
 * Changes `field?: string | components["schemas"]["Users"]` to `field?: components["schemas"]["Users"]`
 */
function transformRelationFields(openapiTypes: string): string {
  // Remove union types from relation fields
  // Pattern: (string | number | components["schemas"]["Users"]) -> components["schemas"]["Users"]
  // Pattern: string | components["schemas"]["Users"] -> components["schemas"]["Users"]
  let result = openapiTypes

  // Remove parentheses and union with string/number
  result = result.replace(
    /\(?(string|number)\s*\|\s*(components\["schemas"\]\["[^"]+"\])\)?/g,
    '$2'
  )

  // Also handle reverse order: components["schemas"]["Users"] | string
  result = result.replace(
    /\(?(components\["schemas"\]\["[^"]+"\])\s*\|\s*(string|number)\)?/g,
    '$1'
  )

  // Handle array types with unions: (string | Type)[]
  result = result.replace(
    /\(\(?(string|number)\s*\|\s*(components\["schemas"\]\["[^"]+"\])\)?\)\[\]/g,
    '$2[]'
  )

  result = result.replace(
    /\(\(?(components\["schemas"\]\["[^"]+"\])\s*\|\s*(string|number)\)?\)\[\]/g,
    '$1[]'
  )

  return result
}
