import type { GenerateOptions } from './types'
import { generateDirectusTypes } from 'directus-sdk-typegen'
import { useLogger } from '@nuxt/kit'
import { cleanDoubleSlashes } from 'ufo'

const logger = useLogger('nuxt-directus-sdk')

/**
 * Generate TypeScript types from Directus collections, fields, and relations
 * Uses @directus/sdk to fetch metadata directly - gives us proper optional/required detection
 */
export async function generateTypes(options: GenerateOptions) {
  const rawTypes = await generateDirectusTypes({ directusUrl: cleanDoubleSlashes(options.url), directusToken: options.token })
  // replace Schema with DirectusSchema
  let directusTypes = rawTypes.replace('export interface Schema {\n', 'export interface DirectusSchema {\n')
  if (!options.prefix.length) {
    return directusTypes
  } else {

    const interfaceRegex = /export\s+interface\s+([A-Za-z0-9_]+)/g;
    const renameMap: Record<string, string> = {};
    // find all instances of 'export interface [EXAMPLE] and add prefix if [EXAMPLE] doesn't start with 'Directus'
    let match;
    while ((match = interfaceRegex.exec(directusTypes)) !== null) {
      const name = match[1];
      if (name && !name.startsWith('Directus')) {
        renameMap[name] = `${options.prefix}${name}`;
      }
    }
    // replace all lines where [EXAMPLE] is exported as an interface with the newly prefixed name
    let prefixedTypes = directusTypes.replace(interfaceRegex, (_, name) => {
      const newName = renameMap[name] || name;
      return `export interface ${newName}`;
    });
    // find and replace references in other interfaces
    for (const [oldName, newName] of Object.entries(renameMap)) {
      const refRegex = new RegExp(`\\b${oldName}\\b`, "g");
      prefixedTypes = prefixedTypes.replace(refRegex, newName);
    }

    return prefixedTypes;
  }

}

