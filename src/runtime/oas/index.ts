import { snakeCase } from 'change-case'
import type { OpenAPI3 } from 'openapi-typescript'
import openApiTs from 'openapi-typescript'
import { authentication, createDirectus, readOpenApiSpec, rest } from '@directus/sdk'

export interface OASOptions {
  url: string
  token: string
  collections?: string[]
}

export async function generateTypes(options: OASOptions): Promise<string> {
  const directus = createDirectus(options.url)
    .with(authentication('json', { autoRefresh: false }))
    .with(rest())

  directus.setToken(options.token)

  const data = await directus.request(readOpenApiSpec())
  const baseSource = await openApiTs(data as OpenAPI3, {})
  const itemPattern = /^ {4}Items([^:]*)/

  const exportProperties = baseSource
    .split('\n')
    .map((line: string) => {
      const match = line.match(itemPattern)
      if (!match)
        return null

      const [, collectionName] = match
      const propertyKey = snakeCase(collectionName)

      if (options.collections && !options.collections.includes(propertyKey))
        return null

      // TODO: maybe changes this to allow singles
      return `${propertyKey}: components["schemas"]["Items${collectionName}"][];`
    })
    .filter((line: any): line is string => {
      return typeof line === 'string'
    })
    .join('\n')

  // Not sure if this is a good idea but only way it lets me use the types
  const exportSource = `
export type Single<T extends any[]> = T extends (infer U)[] ? U : never;

export interface DirectusCollections {
  ${exportProperties}
  directus_users: components["schemas"]["Users"][];
};

declare global {
  interface DirectusCollections {
    ${exportProperties}
    directus_users: components["schemas"]["Users"][];
  };
};

export {};
`

  return [baseSource, exportSource].join('\n')
}
