/**
 * JSON loader for Directus Rules
 *
 * Allows loading rules from JSON format, useful for:
 * - Importing existing permissions exported from Directus
 * - Defining rules in a declarative format without TypeScript
 * - Testing rules against raw JSON
 */

import type {
  CollectionPermissions,
  DirectusValidation,
  PermissionConfig,
  PolicyConfig,
  RoleConfig,
  RulesConfig,
} from '../types'

/**
 * JSON format for a permission configuration
 */
export interface PermissionConfigJson {
  fields?: '*' | string[]
  filter?: Record<string, unknown>
  presets?: Record<string, unknown>
  validation?: Record<string, unknown>
}

/**
 * JSON format for collection permissions
 */
export interface CollectionPermissionsJson {
  create?: boolean | PermissionConfigJson
  read?: boolean | PermissionConfigJson
  update?: boolean | PermissionConfigJson
  delete?: boolean | PermissionConfigJson
  share?: boolean | PermissionConfigJson
}

/**
 * JSON format for a policy
 */
export interface PolicyJson {
  id?: string
  name: string
  icon?: string
  description?: string
  ipAccess?: string[]
  enforceTfa?: boolean
  adminAccess?: boolean
  appAccess?: boolean
  permissions: Record<string, CollectionPermissionsJson>
}

/**
 * JSON format for a role
 */
export interface RoleJson {
  id?: string
  name: string
  icon?: string
  description?: string
  parent?: string
  policies: PolicyJson[]
}

/**
 * JSON format for rules configuration
 */
export interface RulesJson {
  /** JSON Schema reference for IDE support */
  $schema?: string
  roles?: RoleJson[]
  policies?: PolicyJson[]
}

/**
 * Load rules from a JSON string or object
 *
 * @example
 * ```typescript
 * const rules = loadRulesFromJson<DirectusSchema>({
 *   roles: [{
 *     name: 'Editor',
 *     policies: [{
 *       name: 'Content',
 *       permissions: {
 *         posts: { create: true, read: true, update: true }
 *       }
 *     }]
 *   }]
 * })
 * ```
 */
export function loadRulesFromJson<Schema>(
  json: string | RulesJson,
): RulesConfig<Schema> {
  const data: RulesJson = typeof json === 'string' ? JSON.parse(json) : json

  return {
    roles: (data.roles || []).map(role => parseRole<Schema>(role)),
    policies: (data.policies || []).map(policy => parsePolicy<Schema>(policy)),
  }
}

/**
 * Load rules from a JSON file path
 * Works in Node.js environments
 *
 * @example
 * ```typescript
 * const rules = await loadRulesFromJsonFile<DirectusSchema>('./directus/rules.json')
 * ```
 */
export async function loadRulesFromJsonFile<Schema>(
  filePath: string,
): Promise<RulesConfig<Schema>> {
  const fs = await import('node:fs/promises')
  const content = await fs.readFile(filePath, 'utf-8')
  return loadRulesFromJson<Schema>(content)
}

/**
 * Parse a role from JSON
 */
function parseRole<Schema>(role: RoleJson): RoleConfig<Schema> {
  return {
    id: role.id,
    name: role.name,
    icon: role.icon,
    description: role.description,
    parent: role.parent,
    policies: role.policies.map(policy => parsePolicy<Schema>(policy)),
  }
}

/**
 * Parse a policy from JSON
 */
function parsePolicy<Schema>(policy: PolicyJson): PolicyConfig<Schema> {
  const permissions = new Map<keyof Schema, CollectionPermissions<Schema, keyof Schema>>()

  for (const [collection, perms] of Object.entries(policy.permissions)) {
    permissions.set(
      collection as keyof Schema,
      parseCollectionPermissions<Schema>(perms),
    )
  }

  return {
    id: policy.id,
    name: policy.name,
    icon: policy.icon,
    description: policy.description,
    ipAccess: policy.ipAccess,
    enforceTfa: policy.enforceTfa,
    adminAccess: policy.adminAccess,
    appAccess: policy.appAccess ?? true,
    permissions,
  }
}

/**
 * Parse collection permissions from JSON
 */
function parseCollectionPermissions<Schema>(
  perms: CollectionPermissionsJson,
): CollectionPermissions<Schema, keyof Schema> {
  return {
    create: parsePermissionConfig(perms.create),
    read: parsePermissionConfig(perms.read),
    update: parsePermissionConfig(perms.update),
    delete: parsePermissionConfig(perms.delete),
    share: parsePermissionConfig(perms.share),
  } as CollectionPermissions<Schema, keyof Schema>
}

/**
 * Parse a permission config from JSON
 */
function parsePermissionConfig<Schema, Collection extends keyof Schema>(
  config: boolean | PermissionConfigJson | undefined,
): PermissionConfig<Schema, Collection> | boolean | undefined {
  if (config === undefined || typeof config === 'boolean') {
    return config
  }

  return {
    fields: config.fields as '*' | (keyof Schema[Collection])[] | undefined,
    filter: config.filter as any,
    presets: config.presets as Partial<Schema[Collection]> | undefined,
    validation: config.validation as DirectusValidation | undefined,
  }
}

/**
 * Convert rules config back to JSON format
 *
 * @example
 * ```typescript
 * const json = rulesToJson(rules)
 * await fs.writeFile('./rules.json', JSON.stringify(json, null, 2))
 * ```
 */
export function rulesToJson<Schema>(rules: RulesConfig<Schema>): RulesJson {
  return {
    roles: rules.roles.map(role => roleToJson(role)),
    policies: rules.policies.map(policy => policyToJson(policy)),
  }
}

/**
 * Convert a role to JSON format
 */
function roleToJson<Schema>(role: RoleConfig<Schema>): RoleJson {
  return {
    id: role.id,
    name: role.name,
    icon: role.icon,
    description: role.description,
    parent: role.parent,
    policies: role.policies.map(policy => policyToJson(policy)),
  }
}

/**
 * Convert a policy to JSON format
 */
function policyToJson<Schema>(policy: PolicyConfig<Schema>): PolicyJson {
  const permissions: Record<string, CollectionPermissionsJson> = {}

  for (const [collection, perms] of policy.permissions) {
    permissions[collection as string] = collectionPermissionsToJson(perms)
  }

  return {
    id: policy.id,
    name: policy.name,
    icon: policy.icon,
    description: policy.description,
    ipAccess: policy.ipAccess,
    enforceTfa: policy.enforceTfa,
    adminAccess: policy.adminAccess,
    appAccess: policy.appAccess,
    permissions,
  }
}

/**
 * Convert collection permissions to JSON format
 */
function collectionPermissionsToJson<Schema, Collection extends keyof Schema>(
  perms: CollectionPermissions<Schema, Collection>,
): CollectionPermissionsJson {
  return {
    create: permissionConfigToJson(perms.create),
    read: permissionConfigToJson(perms.read),
    update: permissionConfigToJson(perms.update),
    delete: permissionConfigToJson(perms.delete),
    share: permissionConfigToJson(perms.share),
  }
}

/**
 * Convert a permission config to JSON format
 */
function permissionConfigToJson<Schema, Collection extends keyof Schema>(
  config: PermissionConfig<Schema, Collection> | boolean | undefined,
): boolean | PermissionConfigJson | undefined {
  if (config === undefined || typeof config === 'boolean') {
    return config
  }

  return {
    fields: config.fields as '*' | string[] | undefined,
    filter: config.filter as Record<string, unknown> | undefined,
    presets: config.presets as Record<string, unknown> | undefined,
    validation: config.validation as Record<string, unknown> | undefined,
  }
}
