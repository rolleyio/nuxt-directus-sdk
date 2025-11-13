import type { GenerateOptions } from './types'
import { useLogger } from '@nuxt/kit'
import { generateDirectusTypes } from 'directus-sdk-typegen'

const logger = useLogger('nuxt-directus-sdk')

/**
 * Generate TypeScript types from Directus collections using directus-sdk-typegen
 * Wraps the types in a declare global block for Nuxt compatibility
 */
export async function generateTypes(options: GenerateOptions) {
  logger.info(`Generating types from: ${options.url}`)

  // Generate types using directus-sdk-typegen
  const generatedTypes = await generateDirectusTypes({
    directusUrl: options.url.replace(/\/$/, ''),
    directusToken: options.token,
  })

  // Apply prefix to custom collection types (not Directus system collections)
  let processedTypes = generatedTypes
  if (options.prefix) {
    // Step 1: Prefix interface names that don't start with "Directus"
    // Match "export interface XYZ" but not "export interface DirectusXYZ" or "export interface Schema"
    processedTypes = processedTypes.replace(
      /^export interface ((?!Schema\b)(?!Directus)\w+)/gm,
      (match, interfaceName) => {
        // Double-check: don't prefix if interface name starts with "Directus"
        if (interfaceName.startsWith('Directus')) {
          return match
        }
        return `export interface ${options.prefix}${interfaceName}`
      }
    )

    // Step 2: Update type references throughout (but not interface declarations)
    // Split by lines to process each line separately and avoid double-prefixing interface names
    processedTypes = processedTypes.split('\n').map(line => {
      // Skip lines that define interfaces (already handled in Step 1)
      if (line.match(/^export interface /)) {
        return line
      }

      // For all other lines, replace type references
      return line.replace(
        /\b(?!Directus)([A-Z]\w+)(\[\])?/g,
        (match, typeName, array) => {
          // Skip if it's a Directus type, a primitive, or common TS types
          if (
            typeName.startsWith('Directus') ||
            ['String', 'Number', 'Boolean', 'Date', 'Array', 'Record', 'Promise', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Exclude', 'Extract'].includes(typeName) ||
            ['string', 'number', 'boolean', 'any', 'unknown', 'void', 'never', 'null', 'undefined'].includes(typeName.toLowerCase())
          ) {
            return match
          }
          return `${options.prefix}${typeName}${array || ''}`
        }
      )
    }).join('\n')
  }

  // Replace "Schema" with "DirectusSchema" to match our naming convention
  // Remove the "export" keywords and wrap everything in declare global
  const typesWithoutExport = processedTypes
    .replace(/export interface Schema/g, 'interface DirectusSchema')
    .replace(/^export interface /gm, 'interface ')

  // Wrap in declare global block
  return `declare global {
${typesWithoutExport}
}

export {};
`
}
