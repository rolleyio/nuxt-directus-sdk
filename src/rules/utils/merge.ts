/**
 * Utilities for merging and extending rules
 */

import type {
  CollectionPermissions,
  PolicyConfig,
  PolicyInput,
  RoleConfig,
  RoleInput,
  RulesConfig,
} from '../types'
import { parsePolicyInput, parseRoleInput } from '../builders/parser'

/**
 * Merge multiple RulesConfig objects into a single RulesConfig
 *
 * This is useful for combining rules loaded from different sources:
 * - Remote rules pulled from Directus
 * - Local rules defined in code
 * - Rules from different files
 *
 * @example
 * ```typescript
 * import { loadRulesFromPayload, mergeRules, defineDirectusRules } from 'nuxt-directus-sdk/rules'
 *
 * // Load remote rules
 * const remoteRules = loadRulesFromPayload<DirectusSchema>(payload)
 *
 * // Define additional local rules
 * const localRules = defineDirectusRules<DirectusSchema>({
 *   policies: [{
 *     name: 'Additional Policy',
 *     permissions: { posts: { read: true } }
 *   }]
 * })
 *
 * // Merge them
 * const combinedRules = mergeRules(remoteRules, localRules)
 * ```
 */
export function mergeRules<Schema>(...ruleSets: RulesConfig<Schema>[]): RulesConfig<Schema> {
  const roles: RoleConfig<Schema>[] = []
  const policies: PolicyConfig<Schema>[] = []

  for (const rules of ruleSets) {
    roles.push(...rules.roles)
    policies.push(...rules.policies)
  }

  return { roles, policies }
}

/**
 * Extend rules with additional policies defined as input objects
 *
 * This provides a convenient way to add new policies to existing rules
 * without having to use defineDirectusRules separately.
 *
 * @example
 * ```typescript
 * import { loadRulesFromPayload, extendRules } from 'nuxt-directus-sdk/rules'
 *
 * const remoteRules = loadRulesFromPayload<DirectusSchema>(payload)
 *
 * const extendedRules = extendRules(remoteRules, {
 *   policies: [{
 *     name: 'My Custom Policy',
 *     permissions: {
 *       blogs: { read: true, create: { fields: ['title', 'content'] } }
 *     }
 *   }],
 *   roles: [{
 *     name: 'Custom Editor',
 *     policies: [{ name: 'Editor Policy', permissions: { posts: { read: true } } }]
 *   }]
 * })
 * ```
 */
export function extendRules<Schema>(
  base: RulesConfig<Schema>,
  extensions: {
    roles?: RoleInput<Schema>[]
    policies?: PolicyInput<Schema>[]
  },
): RulesConfig<Schema> {
  // Build policy registry from base policies for role reference resolution
  const policyRegistry = new Map<string, PolicyConfig<Schema>>()
  for (const policy of base.policies) {
    if (policy.id) {
      policyRegistry.set(policy.id, policy)
    }
  }

  // Parse new policies and add to registry
  const newPolicies = (extensions.policies ?? []).map((p) => {
    const parsed = parsePolicyInput<Schema>(p)
    if (parsed.id) {
      policyRegistry.set(parsed.id, parsed)
    }
    return parsed
  })

  // Parse new roles
  const newRoles = (extensions.roles ?? []).map((r) => parseRoleInput<Schema>(r, policyRegistry))

  return {
    roles: [...base.roles, ...newRoles],
    policies: [...base.policies, ...newPolicies],
  }
}

/**
 * Add a policy to an existing role by name
 *
 * @example
 * ```typescript
 * const rules = addPolicyToRole(baseRules, 'Editor', {
 *   name: 'Extra Permissions',
 *   permissions: { media: { read: true } }
 * })
 * ```
 */
export function addPolicyToRole<Schema>(
  rules: RulesConfig<Schema>,
  roleName: string,
  policy: PolicyInput<Schema>,
): RulesConfig<Schema> {
  const parsedPolicy = parsePolicyInput<Schema>(policy)

  const roles = rules.roles.map((role) => {
    if (role.name === roleName) {
      return {
        ...role,
        policies: [...role.policies, parsedPolicy],
      }
    }
    return role
  })

  return {
    roles,
    policies: rules.policies,
  }
}

/**
 * Create an admin policy input with full access
 *
 * Returns a PolicyInput that can be used with extendRules or defineDirectusRules.
 *
 * @example
 * ```typescript
 * const rules = extendRules(baseRules, {
 *   roles: [{
 *     name: 'Admin',
 *     policies: [createAdminPolicy('Full Access')]
 *   }]
 * })
 * ```
 */
export function createAdminPolicy<Schema>(
  name: string,
  options?: {
    id?: string
    description?: string
    icon?: string
  },
): PolicyInput<Schema> {
  return {
    id: options?.id,
    name,
    icon: options?.icon ?? 'admin_panel_settings',
    description: options?.description ?? 'Full administrative access',
    adminAccess: true,
    appAccess: true,
    permissions: {} as Record<keyof Schema, never>, // eslint-disable-line typescript/no-unsafe-type-assertion -- empty permissions for admin policy
  }
}

/**
 * Create an admin policy config (Map-based permissions)
 *
 * Returns a PolicyConfig that can be used directly in RulesConfig.
 *
 * @example
 * ```typescript
 * const adminPolicy = createAdminPolicyConfig<DirectusSchema>('Super Admin')
 * ```
 */
export function createAdminPolicyConfig<Schema>(
  name: string,
  options?: {
    id?: string
    description?: string
    icon?: string
  },
): PolicyConfig<Schema> {
  return {
    id: options?.id,
    name,
    icon: options?.icon ?? 'admin_panel_settings',
    description: options?.description ?? 'Full administrative access',
    adminAccess: true,
    appAccess: true,
    permissions: new Map<keyof Schema, CollectionPermissions<Schema, keyof Schema>>(),
  }
}

/**
 * Create a policy config from an input object
 *
 * Useful when you need to programmatically create a PolicyConfig
 * that's compatible with RulesConfig (uses Map for permissions).
 *
 * @example
 * ```typescript
 * const policy = createPolicy<DirectusSchema>({
 *   name: 'Reader',
 *   permissions: { posts: { read: true } }
 * })
 * ```
 */
export function createPolicy<Schema>(input: PolicyInput<Schema>): PolicyConfig<Schema> {
  return parsePolicyInput<Schema>(input)
}

/**
 * Convert a PolicyConfig's permissions Map to a plain object
 *
 * Useful for debugging or serialization.
 */
export function policyPermissionsToObject<Schema>(
  policy: PolicyConfig<Schema>,
): Record<string, CollectionPermissions<Schema, keyof Schema>> {
  const result: Record<string, CollectionPermissions<Schema, keyof Schema>> = {}
  for (const [collection, perms] of policy.permissions) {
    result[String(collection)] = perms
  }
  return result
}
