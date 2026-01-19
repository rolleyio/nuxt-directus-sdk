/**
 * Diff engine for comparing local rules with remote Directus instance
 */

import type { DirectusClient, RestClient } from '@directus/sdk'
import { readPermissions, readPolicies, readRoles } from '@directus/sdk'
import type {
  DirectusPermissionPayload,
  DirectusPolicyPayload,
  DirectusRolePayload,
  DirectusRulesPayload,
} from '../types/directus-api'
import type { PermissionAction, RulesConfig } from '../types/schema'
import { serializeToDirectusApi } from '../utils/serialize'
import { formatDiff } from './format'
import type {
  DiffChange,
  DiffSummary,
  PermissionDiffChange,
  PolicyDiffChange,
  RoleDiffChange,
  RulesDiff,
} from './types'

/**
 * Compare local rules with remote Directus instance
 *
 * @example
 * ```typescript
 * const client = createDirectus('https://directus.example.com').with(rest())
 * const diff = await diffRules(client, localRules)
 *
 * if (diff.hasChanges) {
 *   console.log(diff.toString())
 * }
 * ```
 */
export async function diffRules<Schema>(
  client: DirectusClient<Schema> & RestClient<Schema>,
  localRules: RulesConfig<Schema>,
): Promise<RulesDiff> {
  // 1. Serialize local rules to API format
  const local = serializeToDirectusApi(localRules)

  // 2. Fetch remote state
  const remote = await fetchRemoteRules(client)

  // 3. Compare and generate diff
  return compareRulesPayloads(local, remote)
}

/**
 * Compare rules between two remote Directus instances
 *
 * Useful for comparing staging vs production, or validating migrations.
 *
 * @example
 * ```typescript
 * const staging = createDirectus('https://staging.example.com').with(rest())
 * const production = createDirectus('https://production.example.com').with(rest())
 *
 * const diff = await diffRemoteRules(staging, production)
 *
 * if (diff.hasChanges) {
 *   console.log('Staging differs from production:')
 *   console.log(diff.toString())
 * }
 * ```
 */
export async function diffRemoteRules<SchemaA, SchemaB = SchemaA>(
  sourceClient: DirectusClient<SchemaA> & RestClient<SchemaA>,
  targetClient: DirectusClient<SchemaB> & RestClient<SchemaB>,
): Promise<RulesDiff> {
  // Fetch from both instances in parallel
  const [source, target] = await Promise.all([
    fetchRemoteRules(sourceClient),
    fetchRemoteRules(targetClient),
  ])

  // Compare source (what we want) against target (what exists)
  return compareRulesPayloads(source, target)
}

/**
 * Fetch current rules from a Directus instance
 *
 * @example
 * ```typescript
 * const client = createDirectus('https://directus.example.com').with(rest())
 * const rules = await fetchRemoteRules(client)
 * console.log(rules.roles, rules.policies, rules.permissions)
 * ```
 */
export async function fetchRemoteRules<Schema>(
  client: DirectusClient<Schema> & RestClient<Schema>,
): Promise<DirectusRulesPayload> {
  const [roles, policies, permissions] = await Promise.all([
    client.request(readRoles({ fields: ['*'] })),
    client.request(readPolicies({ fields: ['*'] })),
    client.request(readPermissions({ fields: ['*'] })),
  ])

  return {
    roles: (roles as any[]).map(r => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      description: r.description,
      parent: r.parent,
      policies: r.policies,
    })),
    policies: (policies as any[]).map(p => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      description: p.description,
      ip_access: p.ip_access,
      enforce_tfa: p.enforce_tfa,
      admin_access: p.admin_access,
      app_access: p.app_access,
    })),
    permissions: (permissions as any[]).map(p => ({
      id: p.id,
      policy: p.policy,
      collection: p.collection,
      action: p.action,
      permissions: p.permissions,
      validation: p.validation,
      presets: p.presets,
      fields: p.fields,
    })),
  }
}

/**
 * Fetch rules from a Directus instance and return as JSON string
 *
 * @example
 * ```typescript
 * const client = createDirectus('https://directus.example.com').with(rest())
 *
 * // Save to file
 * const json = await fetchRemoteRulesAsJson(client)
 * await fs.writeFile('rules.json', json)
 *
 * // Or with compact output
 * const compact = await fetchRemoteRulesAsJson(client, false)
 * ```
 */
export async function fetchRemoteRulesAsJson<Schema>(
  client: DirectusClient<Schema> & RestClient<Schema>,
  pretty: boolean = true,
): Promise<string> {
  const rules = await fetchRemoteRules(client)
  return JSON.stringify(rules, null, pretty ? 2 : undefined)
}

/**
 * Compare two DirectusRulesPayload objects and generate diff
 *
 * Exported for testing and direct use when you already have both payloads.
 *
 * @example
 * ```typescript
 * const diff = compareRulesPayloads(localPayload, remotePayload)
 * console.log(diff.summary)
 * ```
 */
export function compareRulesPayloads(
  local: DirectusRulesPayload,
  remote: DirectusRulesPayload,
): RulesDiff {
  const roles = compareRoles(local.roles, remote.roles)
  const policies = comparePolicies(local.policies, remote.policies)
  const permissions = comparePermissions(local.permissions, remote.permissions)

  const summary = {
    roles: countChanges(roles),
    policies: countChanges(policies),
    permissions: countChanges(permissions),
  }

  const hasChanges = roles.some(r => r.type !== 'unchanged')
    || policies.some(p => p.type !== 'unchanged')
    || permissions.some(p => p.type !== 'unchanged')

  return {
    roles,
    policies,
    permissions,
    hasChanges,
    summary,
    toString() {
      return formatDiff(this)
    },
  }
}

/**
 * Compare roles by name
 */
function compareRoles(
  localRoles: DirectusRolePayload[],
  remoteRoles: DirectusRolePayload[],
): RoleDiffChange[] {
  const changes: RoleDiffChange[] = []
  const localMap = new Map(localRoles.map(r => [r.name, r]))
  const remoteMap = new Map(remoteRoles.map(r => [r.name, r]))

  // Find added and modified
  for (const [name, localRole] of localMap) {
    const remoteRole = remoteMap.get(name)
    if (!remoteRole) {
      changes.push({
        type: 'added',
        name: localRole.name,
        id: localRole.id,
        local: localRole,
      })
    }
    else if (!deepEqualRole(localRole, remoteRole)) {
      changes.push({
        type: 'modified',
        name: localRole.name,
        id: remoteRole.id ?? localRole.id,
        local: localRole,
        remote: remoteRole,
      })
    }
    else {
      changes.push({
        type: 'unchanged',
        name: localRole.name,
        id: remoteRole.id ?? localRole.id,
        local: localRole,
        remote: remoteRole,
      })
    }
  }

  // Find removed
  for (const [name, remoteRole] of remoteMap) {
    if (!localMap.has(name)) {
      changes.push({
        type: 'removed',
        name: remoteRole.name,
        id: remoteRole.id,
        remote: remoteRole,
      })
    }
  }

  return changes
}

/**
 * Compare policies by name
 */
function comparePolicies(
  localPolicies: DirectusPolicyPayload[],
  remotePolicies: DirectusPolicyPayload[],
): PolicyDiffChange[] {
  const changes: PolicyDiffChange[] = []
  const localMap = new Map(localPolicies.map(p => [p.name, p]))
  const remoteMap = new Map(remotePolicies.map(p => [p.name, p]))

  // Find added and modified
  for (const [name, localPolicy] of localMap) {
    const remotePolicy = remoteMap.get(name)
    if (!remotePolicy) {
      changes.push({
        type: 'added',
        name: localPolicy.name,
        id: localPolicy.id,
        local: localPolicy,
      })
    }
    else if (!deepEqualPolicy(localPolicy, remotePolicy)) {
      changes.push({
        type: 'modified',
        name: localPolicy.name,
        id: remotePolicy.id ?? localPolicy.id,
        local: localPolicy,
        remote: remotePolicy,
      })
    }
    else {
      changes.push({
        type: 'unchanged',
        name: localPolicy.name,
        id: remotePolicy.id ?? localPolicy.id,
        local: localPolicy,
        remote: remotePolicy,
      })
    }
  }

  // Find removed
  for (const [name, remotePolicy] of remoteMap) {
    if (!localMap.has(name)) {
      changes.push({
        type: 'removed',
        name: remotePolicy.name,
        id: remotePolicy.id,
        remote: remotePolicy,
      })
    }
  }

  return changes
}

/**
 * Compare permissions by composite key (policy + collection + action)
 */
function comparePermissions(
  localPerms: DirectusPermissionPayload[],
  remotePerms: DirectusPermissionPayload[],
): PermissionDiffChange[] {
  const changes: PermissionDiffChange[] = []

  const makeKey = (p: DirectusPermissionPayload) =>
    `${p.policy ?? 'null'}:${p.collection}:${p.action}`

  const makeName = (p: DirectusPermissionPayload) =>
    `${p.collection}.${p.action}`

  const localMap = new Map(localPerms.map(p => [makeKey(p), p]))
  const remoteMap = new Map(remotePerms.map(p => [makeKey(p), p]))

  // Find added and modified
  for (const [key, localPerm] of localMap) {
    const remotePerm = remoteMap.get(key)
    if (!remotePerm) {
      changes.push({
        type: 'added',
        name: makeName(localPerm),
        collection: localPerm.collection,
        action: localPerm.action as PermissionAction,
        policyId: localPerm.policy ?? undefined,
        local: localPerm,
      })
    }
    else if (!deepEqualPermission(localPerm, remotePerm)) {
      changes.push({
        type: 'modified',
        name: makeName(localPerm),
        collection: localPerm.collection,
        action: localPerm.action as PermissionAction,
        policyId: localPerm.policy ?? undefined,
        local: localPerm,
        remote: remotePerm,
      })
    }
    else {
      changes.push({
        type: 'unchanged',
        name: makeName(localPerm),
        collection: localPerm.collection,
        action: localPerm.action as PermissionAction,
        policyId: localPerm.policy ?? undefined,
        local: localPerm,
        remote: remotePerm,
      })
    }
  }

  // Find removed
  for (const [key, remotePerm] of remoteMap) {
    if (!localMap.has(key)) {
      changes.push({
        type: 'removed',
        name: makeName(remotePerm),
        collection: remotePerm.collection,
        action: remotePerm.action as PermissionAction,
        policyId: remotePerm.policy ?? undefined,
        remote: remotePerm,
      })
    }
  }

  return changes
}

/**
 * Deep equality check for roles (ignoring id differences)
 */
function deepEqualRole(a: DirectusRolePayload, b: DirectusRolePayload): boolean {
  return a.name === b.name
    && a.icon === b.icon
    && a.description === b.description
    && a.parent === b.parent
    && deepEqualArray(a.policies, b.policies)
}

/**
 * Deep equality check for policies (ignoring id differences)
 */
function deepEqualPolicy(a: DirectusPolicyPayload, b: DirectusPolicyPayload): boolean {
  return a.name === b.name
    && a.icon === b.icon
    && a.description === b.description
    && a.ip_access === b.ip_access
    && a.enforce_tfa === b.enforce_tfa
    && a.admin_access === b.admin_access
    && a.app_access === b.app_access
}

/**
 * Deep equality check for permissions (ignoring id differences)
 */
function deepEqualPermission(a: DirectusPermissionPayload, b: DirectusPermissionPayload): boolean {
  return a.collection === b.collection
    && a.action === b.action
    && a.policy === b.policy
    && deepEqualJson(a.permissions, b.permissions)
    && deepEqualJson(a.validation, b.validation)
    && deepEqualJson(a.presets, b.presets)
    && deepEqualArray(a.fields, b.fields)
}

/**
 * Deep equality for JSON objects (handles null/undefined and key order)
 */
function deepEqualJson(a: unknown, b: unknown): boolean {
  // Normalize null/undefined
  const normalizedA = a === undefined ? null : a
  const normalizedB = b === undefined ? null : b

  return JSON.stringify(normalizedA, sortKeys) === JSON.stringify(normalizedB, sortKeys)
}

/**
 * Deep equality for arrays (handles null/undefined)
 */
function deepEqualArray(a: unknown[] | null | undefined, b: unknown[] | null | undefined): boolean {
  // Normalize null to undefined for comparison
  const normalizedA = a ?? undefined
  const normalizedB = b ?? undefined

  if (normalizedA === undefined && normalizedB === undefined)
    return true
  if (normalizedA === undefined || normalizedB === undefined)
    return false
  if (normalizedA.length !== normalizedB.length)
    return false

  return JSON.stringify([...normalizedA].sort()) === JSON.stringify([...normalizedB].sort())
}

/**
 * JSON replacer that sorts object keys for consistent comparison
 */
function sortKeys(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.keys(value as object)
      .sort()
      .reduce((sorted, key) => {
        (sorted as Record<string, unknown>)[key] = (value as Record<string, unknown>)[key]
        return sorted
      }, {} as Record<string, unknown>)
  }
  return value
}

/**
 * Count changes by type
 */
function countChanges<T>(changes: DiffChange<T>[]): DiffSummary {
  return {
    added: changes.filter(c => c.type === 'added').length,
    modified: changes.filter(c => c.type === 'modified').length,
    removed: changes.filter(c => c.type === 'removed').length,
  }
}
