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
  DirectusPermissionPayload,
  DirectusPolicyPayload,
  DirectusRolePayload,
  DirectusRulesPayload,
  DirectusValidation,
  PermissionAction,
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
    // TODO: (eslint) revisit any types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ============================================================================
// Directus API Payload Loader
// ============================================================================

/**
 * Load rules from a DirectusRulesPayload (the format from rules:pull CLI command)
 *
 * This is useful when you've pulled rules from Directus and want to:
 * - Use them in tests with createRulesTester
 * - Combine them with additional local policies
 * - Convert them to the RulesConfig format for manipulation
 *
 * @example
 * ```typescript
 * import { readFileSync } from 'fs'
 * import { loadRulesFromPayload, defineDirectusRules } from 'nuxt-directus-sdk/rules'
 *
 * // Load rules pulled from Directus
 * const payload = JSON.parse(readFileSync('./rules.json', 'utf-8'))
 * const remoteRules = loadRulesFromPayload<DirectusSchema>(payload)
 *
 * // Combine with additional local policies
 * const combinedRules = defineDirectusRules<DirectusSchema>({
 *   roles: remoteRules.roles,
 *   policies: [
 *     ...remoteRules.policies,
 *     {
 *       name: 'My Additional Policy',
 *       permissions: {
 *         posts: { read: true }
 *       }
 *     }
 *   ]
 * })
 * ```
 */
export function loadRulesFromPayload<Schema>(
  payload: DirectusRulesPayload,
): RulesConfig<Schema> {
  // Build a map of policy ID -> permissions
  const permissionsByPolicy = new Map<string | null, DirectusPermissionPayload[]>()
  for (const perm of payload.permissions) {
    const key = perm.policy ?? null
    if (!permissionsByPolicy.has(key)) {
      permissionsByPolicy.set(key, [])
    }
    permissionsByPolicy.get(key)!.push(perm)
  }

  // Convert policies
  const policies = payload.policies.map((policy) => {
    const policyPerms = permissionsByPolicy.get(policy.id ?? null) ?? []
    return convertPayloadPolicy<Schema>(policy, policyPerms)
  })

  // Build a map of policy ID -> PolicyConfig for role reference
  const policyById = new Map<string, PolicyConfig<Schema>>()
  for (let i = 0; i < payload.policies.length; i++) {
    const apiPolicy = payload.policies[i]
    if (apiPolicy.id) {
      policyById.set(apiPolicy.id, policies[i])
    }
  }

  // Convert roles with their attached policies
  const roles = payload.roles.map((role) => {
    const rolePolicies: PolicyConfig<Schema>[] = []
    if (role.policies) {
      for (const policyId of role.policies) {
        const policy = policyById.get(policyId)
        if (policy) {
          rolePolicies.push(policy)
        }
      }
    }
    // Pass original policy IDs so they can be preserved during serialization
    return convertPayloadRole<Schema>(role, rolePolicies, role.policies ?? undefined)
  })

  return { roles, policies }
}

/**
 * Load rules from a JSON file containing DirectusRulesPayload format
 *
 * @example
 * ```typescript
 * const rules = await loadRulesFromPayloadFile<DirectusSchema>('./rules.json')
 * ```
 */
export async function loadRulesFromPayloadFile<Schema>(
  filePath: string,
): Promise<RulesConfig<Schema>> {
  const fs = await import('node:fs/promises')
  const content = await fs.readFile(filePath, 'utf-8')
  const payload: DirectusRulesPayload = JSON.parse(content)
  return loadRulesFromPayload<Schema>(payload)
}

/**
 * Convert a Directus API policy to PolicyConfig
 */
function convertPayloadPolicy<Schema>(
  policy: DirectusPolicyPayload,
  permissions: DirectusPermissionPayload[],
): PolicyConfig<Schema> {
  const permissionsMap = new Map<keyof Schema, CollectionPermissions<Schema, keyof Schema>>()

  // Group permissions by collection
  const permsByCollection = new Map<string, DirectusPermissionPayload[]>()
  for (const perm of permissions) {
    if (!permsByCollection.has(perm.collection)) {
      permsByCollection.set(perm.collection, [])
    }
    permsByCollection.get(perm.collection)!.push(perm)
  }

  // Convert each collection's permissions
  for (const [collection, collectionPerms] of permsByCollection) {
    const collPerms: Partial<CollectionPermissions<Schema, keyof Schema>> = {}

    for (const perm of collectionPerms) {
      const action = perm.action as PermissionAction
      const config = convertPayloadPermission<Schema>(perm)
      if (action === 'create')
        collPerms.create = config
      else if (action === 'read')
        collPerms.read = config
      else if (action === 'update')
        collPerms.update = config
      else if (action === 'delete')
        collPerms.delete = config
      else if (action === 'share')
        collPerms.share = config
    }

    permissionsMap.set(collection as keyof Schema, collPerms as CollectionPermissions<Schema, keyof Schema>)
  }

  return {
    id: policy.id,
    name: policy.name,
    icon: policy.icon,
    description: policy.description ?? undefined,
    ipAccess: policy.ip_access ? policy.ip_access.split(',').map(s => s.trim()) : undefined,
    enforceTfa: policy.enforce_tfa,
    adminAccess: policy.admin_access,
    appAccess: policy.app_access,
    permissions: permissionsMap,
  }
}

/**
 * Convert a Directus API permission to PermissionConfig
 */
function convertPayloadPermission<Schema>(
  perm: DirectusPermissionPayload,
): PermissionConfig<Schema, keyof Schema> | true {
  const hasConfig = perm.permissions || perm.validation || perm.presets || (perm.fields && perm.fields.length > 0)

  if (!hasConfig) {
    return true
  }

  return {
    fields: perm.fields
      ? (perm.fields.includes('*') ? '*' : perm.fields) as '*' | (keyof Schema[keyof Schema])[]
      : undefined,
    // TODO: (eslint) revisit any types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: perm.permissions as any,
    // TODO: (eslint) revisit any types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    presets: perm.presets as any,
    validation: perm.validation ?? undefined,
  }
}

/**
 * Convert a Directus API role to RoleConfig
 */
function convertPayloadRole<Schema>(
  role: DirectusRolePayload,
  policies: PolicyConfig<Schema>[],
  originalPolicyIds?: string[],
): RoleConfig<Schema> {
  return {
    id: role.id,
    name: role.name,
    icon: role.icon,
    description: role.description ?? undefined,
    parent: role.parent ?? undefined,
    policies,
    // Preserve original policy IDs for serialization when policies couldn't be resolved
    _originalPolicyIds: originalPolicyIds,
  }
}
