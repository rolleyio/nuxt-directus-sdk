/**
 * Field access checker for testing permissions
 */

import type {
  PermissionAction,
  PermissionConfig,
  PolicyConfig,
  RulesConfig,
} from '../types'

/**
 * Check if a role/policy grants access to specific fields
 *
 * @param rules - The rules configuration
 * @param roleOrPolicy - Name of the role or policy
 * @param action - The permission action
 * @param collection - The collection name
 * @returns Array of accessible field names, '*' for all, or empty array for none
 */
export function getAccessibleFields<Schema>(
  rules: RulesConfig<Schema>,
  roleOrPolicy: string,
  action: PermissionAction,
  collection: keyof Schema,
): (keyof Schema[typeof collection])[] | '*' {
  const policies = getPoliciesFor(rules, roleOrPolicy)

  if (!policies.length) {
    return []
  }

  // Collect all accessible fields from all matching policies
  const allFields = new Set<keyof Schema[typeof collection]>()
  let hasWildcard = false

  for (const policy of policies) {
    // Admin access = all fields
    if (policy.adminAccess) {
      return '*'
    }

    const collectionPerms = policy.permissions.get(collection)
    if (!collectionPerms)
      continue

    const perm = collectionPerms[action]
    if (perm === true) {
      hasWildcard = true
    }
    else if (perm && typeof perm === 'object') {
      const permConfig = perm as PermissionConfig<Schema, typeof collection>
      if (permConfig.fields === '*') {
        hasWildcard = true
      }
      else if (Array.isArray(permConfig.fields)) {
        for (const field of permConfig.fields) {
          allFields.add(field)
        }
      }
      else {
        // No fields specified = all fields
        hasWildcard = true
      }
    }
  }

  if (hasWildcard) {
    return '*'
  }

  return Array.from(allFields)
}

/**
 * Check if a role/policy grants access to a specific field
 *
 * @param rules - The rules configuration
 * @param roleOrPolicy - Name of the role or policy
 * @param action - The permission action
 * @param collection - The collection name
 * @param field - The field to check
 * @returns true if the field is accessible
 */
export function canAccessField<Schema>(
  rules: RulesConfig<Schema>,
  roleOrPolicy: string,
  action: PermissionAction,
  collection: keyof Schema,
  field: keyof Schema[typeof collection],
): boolean {
  const accessibleFields = getAccessibleFields(rules, roleOrPolicy, action, collection)

  if (accessibleFields === '*') {
    return true
  }

  return accessibleFields.includes(field)
}

/**
 * Get presets for a permission
 *
 * @param rules - The rules configuration
 * @param roleOrPolicy - Name of the role or policy
 * @param action - The permission action
 * @param collection - The collection name
 * @returns The presets object or null
 */
export function getPresets<Schema>(
  rules: RulesConfig<Schema>,
  roleOrPolicy: string,
  action: PermissionAction,
  collection: keyof Schema,
): Partial<Schema[typeof collection]> | null {
  const policies = getPoliciesFor(rules, roleOrPolicy)

  for (const policy of policies) {
    const collectionPerms = policy.permissions.get(collection)
    if (!collectionPerms)
      continue

    const perm = collectionPerms[action]
    if (perm && typeof perm === 'object') {
      const permConfig = perm as PermissionConfig<Schema, typeof collection>
      if (permConfig.presets) {
        return permConfig.presets
      }
    }
  }

  return null
}

/**
 * Get all policies for a role or policy name
 */
function getPoliciesFor<Schema>(
  rules: RulesConfig<Schema>,
  roleOrPolicy: string,
): PolicyConfig<Schema>[] {
  // Check if it's a role
  const role = rules.roles.find(r => r.name === roleOrPolicy)
  if (role) {
    return role.policies
  }

  // Check standalone policies
  const standalonePolicy = rules.policies.find(p => p.name === roleOrPolicy)
  if (standalonePolicy) {
    return [standalonePolicy]
  }

  // Check policies within roles
  for (const r of rules.roles) {
    const policy = r.policies.find(p => p.name === roleOrPolicy)
    if (policy) {
      return [policy]
    }
  }

  return []
}
