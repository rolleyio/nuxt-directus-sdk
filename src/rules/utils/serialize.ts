/**
 * Serialization utilities for converting rules to various formats
 */

import type {
  DirectusValidation,
  PermissionAction,
  PermissionConfig,
  PolicyConfig,
  RulesConfig,
  StandardSchemaV1,
} from '../types'
import type {
  DirectusPermissionPayload,
  DirectusPolicyPayload,
  DirectusRolePayload,
  DirectusRulesPayload,
} from '../types/directus-api'
import { isStandardSchema } from '../types'
import { toDirectusValidation } from '../validation'

/**
 * Generate a UUID v4
 */
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Normalized rules structure where all policies are at the top level
 * and roles only contain policy IDs
 */
export interface NormalizedRules<Schema> {
  /** All policies (both standalone and extracted from roles) */
  policies: PolicyConfig<Schema>[]
  /** Roles with policy IDs instead of inline policies */
  roles: NormalizedRole[]
}

/**
 * A role with policy references instead of inline policies
 */
export interface NormalizedRole {
  id?: string
  name: string
  icon?: string
  description?: string
  parent?: string
  /** IDs of the policies attached to this role */
  policyIds: string[]
}

/**
 * Normalize rules by extracting all inline policies to the top level
 *
 * This function:
 * 1. Extracts all inline policies from roles
 * 2. Assigns UUIDs to policies without IDs
 * 3. Deduplicates policies (same object reference = same policy)
 * 4. Returns a normalized structure with all policies at the top level
 *
 * @example
 * ```typescript
 * const normalized = normalizeRules(rules)
 * // normalized.policies - all policies with IDs
 * // normalized.roles - roles with policyIds array
 * ```
 */
export function normalizeRules<Schema>(
  rules: RulesConfig<Schema>,
): NormalizedRules<Schema> {
  // Track policies by object reference to deduplicate
  const policyMap = new Map<PolicyConfig<Schema>, string>()
  const allPolicies: PolicyConfig<Schema>[] = []

  // Helper to register a policy and get its ID
  function registerPolicy(policy: PolicyConfig<Schema>): string {
    // Check if we've already seen this exact policy object
    const existingId = policyMap.get(policy)
    if (existingId) {
      return existingId
    }

    // Assign ID if missing
    const id = policy.id ?? generateUuid()
    if (!policy.id) {
      policy.id = id
    }

    policyMap.set(policy, id)
    allPolicies.push(policy)
    return id
  }

  // First, register all standalone policies
  for (const policy of rules.policies) {
    registerPolicy(policy)
  }

  // Process roles, extracting and registering inline policies
  const normalizedRoles: NormalizedRole[] = rules.roles.map((role) => {
    // Get policy IDs from resolved policies
    const resolvedPolicyIds = role.policies.map(policy => registerPolicy(policy))

    // If role has no resolved policies but has original IDs, use those
    // This preserves references that couldn't be resolved during loading
    let policyIds: string[]
    if (resolvedPolicyIds.length === 0 && role._originalPolicyIds && role._originalPolicyIds.length > 0) {
      policyIds = role._originalPolicyIds
    }
    else {
      policyIds = resolvedPolicyIds
    }

    return {
      id: role.id,
      name: role.name,
      icon: role.icon,
      description: role.description,
      parent: role.parent,
      policyIds,
    }
  })

  return {
    policies: allPolicies,
    roles: normalizedRoles,
  }
}

/**
 * Serialize rules to Directus API payload format
 *
 * This normalizes the rules first, extracting all policies to the top level
 * and assigning UUIDs to any policies without IDs. Policies are deduplicated
 * so shared policies only appear once.
 *
 * @example
 * ```typescript
 * const payload = serializeToDirectusApi(rules)
 * // payload.roles - roles with policy IDs
 * // payload.policies - all policies (deduplicated)
 * // payload.permissions - all permissions linked to policies
 * ```
 */
export function serializeToDirectusApi<Schema>(
  rules: RulesConfig<Schema>,
): DirectusRulesPayload {
  // Normalize first to extract and deduplicate policies
  const normalized = normalizeRules(rules)

  // Serialize roles
  const roles: DirectusRolePayload[] = normalized.roles.map(role => ({
    id: role.id,
    name: role.name,
    icon: role.icon ?? 'supervised_user_circle',
    description: role.description ?? null,
    parent: role.parent ?? null,
    policies: role.policyIds,
  }))

  // Serialize policies (already deduplicated)
  const policies: DirectusPolicyPayload[] = []
  const permissions: DirectusPermissionPayload[] = []

  for (const policy of normalized.policies) {
    policies.push(serializePolicy(policy))
    permissions.push(...serializePolicyPermissions(policy))
  }

  return { roles, policies, permissions }
}

/**
 * Serialize a policy to Directus API format
 */
function serializePolicy<Schema>(policy: PolicyConfig<Schema>): DirectusPolicyPayload {
  return {
    id: policy.id,
    name: policy.name,
    icon: policy.icon ?? 'badge',
    description: policy.description ?? null,
    ip_access: policy.ipAccess?.join(',') ?? null,
    enforce_tfa: policy.enforceTfa ?? false,
    admin_access: policy.adminAccess ?? false,
    app_access: policy.appAccess ?? true,
  }
}

/**
 * Serialize permissions from a policy
 */
function serializePolicyPermissions<Schema>(
  policy: PolicyConfig<Schema>,
): DirectusPermissionPayload[] {
  const permissions: DirectusPermissionPayload[] = []

  for (const [collection, collectionPerms] of policy.permissions) {
    const actions: PermissionAction[] = ['create', 'read', 'update', 'delete', 'share']

    for (const action of actions) {
      const perm = collectionPerms[action]
      if (perm === undefined || perm === false)
        continue

      const permPayload = serializePermission(
        String(collection),
        action,
        perm,
        policy.id,
      )
      if (permPayload) {
        permissions.push(permPayload)
      }
    }
  }

  return permissions
}

/**
 * Serialize a single permission
 */
function serializePermission<Schema, Collection extends keyof Schema>(
  collection: string,
  action: PermissionAction,
  config: boolean | PermissionConfig<Schema, Collection>,
  policyId?: string,
): DirectusPermissionPayload | null {
  if (config === false) {
    return null
  }

  if (config === true) {
    return {
      policy: policyId ?? null,
      collection,
      action,
      permissions: null, // No filter = all items
      validation: null,
      presets: null,
      fields: ['*'], // All fields - matches Directus format
    }
  }

  // It's a PermissionConfig object
  const permConfig = config as PermissionConfig<Schema, Collection>

  // Handle validation - convert Standard Schema if needed
  let validation: DirectusValidation | null = null
  if (permConfig.validation) {
    if (isStandardSchema(permConfig.validation)) {
      try {
        validation = toDirectusValidation(permConfig.validation as StandardSchemaV1)
      }
      catch (error) {
        console.warn(`Could not convert validation schema: ${error}`)
      }
    }
    else {
      validation = permConfig.validation as DirectusValidation
    }
  }

  return {
    policy: policyId ?? null,
    collection,
    action,
    permissions: permConfig.filter as Record<string, unknown> ?? null,
    validation,
    presets: permConfig.presets as Record<string, unknown> ?? null,
    fields: permConfig.fields === '*' ? ['*'] : (permConfig.fields as string[] ?? null),
  }
}

/**
 * Serialize rules to normalized JSON string
 *
 * Outputs a clean JSON format where:
 * - Policies are defined at the top level with IDs
 * - Roles reference policies by ID only (`{ id: 'policy-id' }`)
 * - No duplication of policy definitions
 *
 * @example
 * ```typescript
 * const json = serializeToJson(rules)
 * await fs.writeFile('rules.json', json)
 * ```
 */
export function serializeToJson<Schema>(
  rules: RulesConfig<Schema>,
  pretty: boolean = true,
): string {
  // Normalize to extract and deduplicate policies
  const normalized = normalizeRules(rules)

  // Build JSON-friendly structure with policy references
  const output = {
    policies: normalized.policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      icon: policy.icon,
      description: policy.description,
      ipAccess: policy.ipAccess,
      enforceTfa: policy.enforceTfa,
      adminAccess: policy.adminAccess,
      appAccess: policy.appAccess,
      permissions: Object.fromEntries(policy.permissions),
    })),
    roles: normalized.roles.map(role => ({
      id: role.id,
      name: role.name,
      icon: role.icon,
      description: role.description,
      parent: role.parent,
      // Reference policies by ID only
      policies: role.policyIds.map(id => ({ id })),
    })),
  }

  // Remove undefined values during serialization
  return JSON.stringify(output, (_, value) => value === undefined ? undefined : value, pretty ? 2 : undefined)
}
