/**
 * Parser functions for converting input objects to internal config format
 */

import type {
  CollectionPermissions,
  CollectionPermissionsInput,
  PermissionConfig,
  PermissionInput,
  PermissionsInput,
  PolicyConfig,
  PolicyInput,
  RoleConfig,
  RoleInput,
  RulesConfig,
  RulesInput,
} from '../types'
import { isPolicyReference } from '../types'

/**
 * Parse a rules input object into a RulesConfig
 *
 * Uses two-phase parsing:
 * 1. Parse standalone policies first, building a registry by ID
 * 2. Parse roles, resolving policy references from the registry
 */
export function parseRulesInput<Schema>(input: RulesInput<Schema>): RulesConfig<Schema> {
  // Phase 1: Parse standalone policies first, build registry by ID
  const policyRegistry = new Map<string, PolicyConfig<Schema>>()
  const policies = (input.policies ?? []).map((p) => {
    const parsed = parsePolicyInput<Schema>(p)
    if (parsed.id) {
      policyRegistry.set(parsed.id, parsed)
    }
    return parsed
  })

  // Phase 2: Parse roles, resolving policy references
  const roles = (input.roles ?? []).map(r =>
    parseRoleInput<Schema>(r, policyRegistry),
  )

  return { roles, policies }
}

/**
 * Parse a role input into a RoleConfig
 *
 * @param input - The role input to parse
 * @param policyRegistry - Optional registry of standalone policies for resolving references
 */
export function parseRoleInput<Schema>(
  input: RoleInput<Schema>,
  policyRegistry?: Map<string, PolicyConfig<Schema>>,
): RoleConfig<Schema> {
  const policies = input.policies.map((p) => {
    // Check if it's a reference (has id, no name)
    if (isPolicyReference<Schema>(p)) {
      const policy = policyRegistry?.get(p.id)
      if (!policy) {
        throw new Error(`Policy with id "${p.id}" not found in standalone policies`)
      }
      return policy
    }
    // Otherwise it's an inline policy
    return parsePolicyInput<Schema>(p)
  })

  return {
    id: input.id,
    name: input.name,
    icon: input.icon,
    description: input.description,
    parent: input.parent,
    policies,
  }
}

/**
 * Parse a policy input into a PolicyConfig
 */
export function parsePolicyInput<Schema>(input: PolicyInput<Schema>): PolicyConfig<Schema> {
  return {
    id: input.id,
    name: input.name,
    icon: input.icon,
    description: input.description,
    ipAccess: input.ipAccess,
    enforceTfa: input.enforceTfa,
    adminAccess: input.adminAccess,
    appAccess: input.appAccess,
    permissions: parsePermissionsInput<Schema>(input.permissions),
  }
}

/**
 * Parse permissions input (object notation) into a Map
 */
export function parsePermissionsInput<Schema>(
  input: PermissionsInput<Schema>,
): Map<keyof Schema, CollectionPermissions<Schema, keyof Schema>> {
  const permissions = new Map<keyof Schema, CollectionPermissions<Schema, keyof Schema>>()

  for (const [collection, perms] of Object.entries(input) as [keyof Schema, CollectionPermissionsInput<Schema, keyof Schema>][]) {
    if (perms) {
      permissions.set(collection, parseCollectionPermissionsInput<Schema, keyof Schema>(perms))
    }
  }

  return permissions
}

/**
 * Parse collection permissions input
 */
export function parseCollectionPermissionsInput<Schema, K extends keyof Schema>(
  input: CollectionPermissionsInput<Schema, K>,
): CollectionPermissions<Schema, K> {
  return {
    create: normalizePermission<Schema, K>(input.create),
    read: normalizePermission<Schema, K>(input.read),
    update: normalizePermission<Schema, K>(input.update),
    delete: normalizePermission<Schema, K>(input.delete),
    share: normalizePermission<Schema, K>(input.share),
  }
}

/**
 * Normalize a permission input to the internal format
 *
 * - `undefined` → `undefined`
 * - `true` → `true`
 * - `false` → `false`
 * - `'*'` → `{ fields: '*' }`
 * - `{ ... }` → `{ ... }`
 */
export function normalizePermission<Schema, K extends keyof Schema>(
  input: PermissionInput<Schema, K> | undefined,
): PermissionConfig<Schema, K> | boolean | undefined {
  if (input === undefined) {
    return undefined
  }

  if (typeof input === 'boolean') {
    return input
  }

  if (input === '*') {
    return { fields: '*' } as PermissionConfig<Schema, K>
  }

  // It's a detailed config object
  return input as PermissionConfig<Schema, K>
}
