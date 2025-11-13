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

  // Replace "Schema" with "DirectusSchema" to match our naming convention
  // Remove the "export" keywords and wrap everything in declare global
  const typesWithoutExport = generatedTypes
    .replace(/export interface Schema/g, 'interface DirectusSchema')
    .replace(/^export interface /gm, 'interface ')

  // Wrap in declare global block
  return `declare global {
${typesWithoutExport}
}

export {};
`
}
