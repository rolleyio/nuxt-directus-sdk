/**
 * Push engine for syncing local rules to remote Directus instance
 */

import type { DirectusClient, RestClient } from '@directus/sdk'
import {
  createPermission,
  createPolicy,
  createRole,
  deletePermission,
  deletePolicy,
  deleteRole,
  updatePermission,
  updatePolicy,
  updateRole,
} from '@directus/sdk'
import type { RulesConfig } from '../types'
import { serializeToDirectusApi } from '../utils/serialize'
import { compareRulesPayloads, fetchRemoteRules } from './diff'
import type {
  PushOperationResult,
  PushOptions,
  PushProgressEvent,
  PushResult,
} from './types'

/**
 * Push local rules to a remote Directus instance
 *
 * This function:
 * 1. Fetches the current remote state
 * 2. Computes the diff between local and remote
 * 3. Applies changes in the correct order:
 *    - Create/update policies first (roles reference them)
 *    - Create/update roles
 *    - Create/update permissions last (they reference policies)
 *    - Delete in reverse order: permissions, roles, policies
 *
 * @example
 * ```typescript
 * import { pushRules, diffRules } from 'nuxt-directus-sdk/rules'
 *
 * // Preview changes first
 * const diff = await diffRules(client, localRules)
 * console.log(diff.toString())
 *
 * // If you're happy, push
 * const result = await pushRules(client, localRules)
 *
 * if (result.success) {
 *   console.log('Pushed successfully!')
 * } else {
 *   console.error('Errors:', result.errors)
 * }
 * ```
 */
export async function pushRules<Schema>(
  client: DirectusClient<Schema> & RestClient<Schema>,
  localRules: RulesConfig<Schema>,
  options: PushOptions = {},
): Promise<PushResult> {
  const { addOnly = false, skipDeletes = false, onProgress } = options

  const result: PushResult = {
    success: true,
    roles: [],
    policies: [],
    permissions: [],
    summary: {
      roles: { created: 0, updated: 0, deleted: 0, errors: 0 },
      policies: { created: 0, updated: 0, deleted: 0, errors: 0 },
      permissions: { created: 0, updated: 0, deleted: 0, errors: 0 },
    },
    errors: [],
  }

  try {
    // 1. Serialize local rules and fetch remote state
    const local = serializeToDirectusApi(localRules)
    const remote = await fetchRemoteRules(client)

    // 2. Compute diff
    const diff = compareRulesPayloads(local, remote)

    if (!diff.hasChanges) {
      return result
    }

    // 3. Push policies first (roles reference them)
    const policyIdMap = new Map<string, string>() // local ID -> remote ID

    // Create new policies
    const policiesToCreate = diff.policies.filter(p => p.type === 'added')
    for (let i = 0; i < policiesToCreate.length; i++) {
      const change = policiesToCreate[i]
      onProgress?.({
        phase: 'policies',
        action: 'create',
        name: change.name,
        current: i + 1,
        total: policiesToCreate.length,
      })

      try {
        const created = await client.request(
          createPolicy({
            name: change.local!.name,
            icon: change.local!.icon,
            description: change.local!.description,
            ip_access: change.local!.ip_access,
            enforce_tfa: change.local!.enforce_tfa,
            admin_access: change.local!.admin_access,
            app_access: change.local!.app_access,
          }),
        )
        const newId = (created as any).id
        if (change.local!.id) {
          policyIdMap.set(change.local!.id, newId)
        }
        result.policies.push({ type: 'created', name: change.name, id: newId })
        result.summary.policies.created++
      }
      catch (error) {
        const message = `Failed to create policy "${change.name}": ${error}`
        result.errors.push(message)
        result.policies.push({ type: 'skipped', name: change.name, error: message })
        result.summary.policies.errors++
        result.success = false
      }
    }

    // Update modified policies
    if (!addOnly) {
      const policiesToUpdate = diff.policies.filter(p => p.type === 'modified')
      for (let i = 0; i < policiesToUpdate.length; i++) {
        const change = policiesToUpdate[i]
        onProgress?.({
          phase: 'policies',
          action: 'update',
          name: change.name,
          current: i + 1,
          total: policiesToUpdate.length,
        })

        try {
          const remoteId = change.remote!.id!
          await client.request(
            updatePolicy(remoteId, {
              name: change.local!.name,
              icon: change.local!.icon,
              description: change.local!.description,
              ip_access: change.local!.ip_access,
              enforce_tfa: change.local!.enforce_tfa,
              admin_access: change.local!.admin_access,
              app_access: change.local!.app_access,
            }),
          )
          if (change.local!.id) {
            policyIdMap.set(change.local!.id, remoteId)
          }
          result.policies.push({ type: 'updated', name: change.name, id: remoteId })
          result.summary.policies.updated++
        }
        catch (error) {
          const message = `Failed to update policy "${change.name}": ${error}`
          result.errors.push(message)
          result.policies.push({ type: 'skipped', name: change.name, error: message })
          result.summary.policies.errors++
          result.success = false
        }
      }
    }

    // Map unchanged policies too
    for (const change of diff.policies.filter(p => p.type === 'unchanged')) {
      if (change.local!.id && change.remote!.id) {
        policyIdMap.set(change.local!.id, change.remote!.id)
      }
    }

    // 4. Push roles (now that policies exist)
    // Create new roles
    const rolesToCreate = diff.roles.filter(r => r.type === 'added')
    for (let i = 0; i < rolesToCreate.length; i++) {
      const change = rolesToCreate[i]
      onProgress?.({
        phase: 'roles',
        action: 'create',
        name: change.name,
        current: i + 1,
        total: rolesToCreate.length,
      })

      try {
        // Map local policy IDs to remote IDs
        const remotePolicyIds = (change.local!.policies || []).map((localId) => {
          return policyIdMap.get(localId) || localId
        })

        await client.request(
          createRole({
            name: change.local!.name,
            icon: change.local!.icon,
            description: change.local!.description,
            parent: change.local!.parent,
            policies: remotePolicyIds,
          }),
        )
        result.roles.push({ type: 'created', name: change.name })
        result.summary.roles.created++
      }
      catch (error) {
        const message = `Failed to create role "${change.name}": ${error}`
        result.errors.push(message)
        result.roles.push({ type: 'skipped', name: change.name, error: message })
        result.summary.roles.errors++
        result.success = false
      }
    }

    // Update modified roles
    if (!addOnly) {
      const rolesToUpdate = diff.roles.filter(r => r.type === 'modified')
      for (let i = 0; i < rolesToUpdate.length; i++) {
        const change = rolesToUpdate[i]
        onProgress?.({
          phase: 'roles',
          action: 'update',
          name: change.name,
          current: i + 1,
          total: rolesToUpdate.length,
        })

        try {
          const remoteId = change.remote!.id!
          // Map local policy IDs to remote IDs
          const remotePolicyIds = (change.local!.policies || []).map((localId) => {
            return policyIdMap.get(localId) || localId
          })

          await client.request(
            updateRole(remoteId, {
              name: change.local!.name,
              icon: change.local!.icon,
              description: change.local!.description,
              parent: change.local!.parent,
              policies: remotePolicyIds,
            }),
          )
          result.roles.push({ type: 'updated', name: change.name, id: remoteId })
          result.summary.roles.updated++
        }
        catch (error) {
          const message = `Failed to update role "${change.name}": ${error}`
          result.errors.push(message)
          result.roles.push({ type: 'skipped', name: change.name, error: message })
          result.summary.roles.errors++
          result.success = false
        }
      }
    }

    // 5. Push permissions (after policies exist)
    // Create new permissions
    const permsToCreate = diff.permissions.filter(p => p.type === 'added')
    for (let i = 0; i < permsToCreate.length; i++) {
      const change = permsToCreate[i]
      onProgress?.({
        phase: 'permissions',
        action: 'create',
        name: change.name,
        current: i + 1,
        total: permsToCreate.length,
      })

      try {
        // Map local policy ID to remote ID
        const localPolicyId = change.local!.policy
        const remotePolicyId = localPolicyId ? (policyIdMap.get(localPolicyId) || localPolicyId) : null

        await client.request(
          createPermission({
            policy: remotePolicyId,
            collection: change.local!.collection,
            action: change.local!.action,
            permissions: change.local!.permissions,
            validation: change.local!.validation,
            presets: change.local!.presets,
            fields: change.local!.fields,
          }),
        )
        result.permissions.push({ type: 'created', name: change.name })
        result.summary.permissions.created++
      }
      catch (error) {
        const message = `Failed to create permission "${change.name}": ${error}`
        result.errors.push(message)
        result.permissions.push({ type: 'skipped', name: change.name, error: message })
        result.summary.permissions.errors++
        result.success = false
      }
    }

    // Update modified permissions
    if (!addOnly) {
      const permsToUpdate = diff.permissions.filter(p => p.type === 'modified')
      for (let i = 0; i < permsToUpdate.length; i++) {
        const change = permsToUpdate[i]
        onProgress?.({
          phase: 'permissions',
          action: 'update',
          name: change.name,
          current: i + 1,
          total: permsToUpdate.length,
        })

        try {
          const remoteId = change.remote!.id!
          await client.request(
            updatePermission(remoteId, {
              permissions: change.local!.permissions,
              validation: change.local!.validation,
              presets: change.local!.presets,
              fields: change.local!.fields,
            }),
          )
          result.permissions.push({ type: 'updated', name: change.name, id: String(remoteId) })
          result.summary.permissions.updated++
        }
        catch (error) {
          const message = `Failed to update permission "${change.name}": ${error}`
          result.errors.push(message)
          result.permissions.push({ type: 'skipped', name: change.name, error: message })
          result.summary.permissions.errors++
          result.success = false
        }
      }
    }

    // 6. Delete in reverse order (if not skipped)
    if (!skipDeletes && !addOnly) {
      // Delete permissions first
      const permsToDelete = diff.permissions.filter(p => p.type === 'removed')
      for (let i = 0; i < permsToDelete.length; i++) {
        const change = permsToDelete[i]
        onProgress?.({
          phase: 'permissions',
          action: 'delete',
          name: change.name,
          current: i + 1,
          total: permsToDelete.length,
        })

        try {
          await client.request(deletePermission(change.remote!.id!))
          result.permissions.push({ type: 'deleted', name: change.name, id: String(change.remote!.id) })
          result.summary.permissions.deleted++
        }
        catch (error) {
          const message = `Failed to delete permission "${change.name}": ${error}`
          result.errors.push(message)
          result.permissions.push({ type: 'skipped', name: change.name, error: message })
          result.summary.permissions.errors++
          result.success = false
        }
      }

      // Delete roles
      const rolesToDelete = diff.roles.filter(r => r.type === 'removed')
      for (let i = 0; i < rolesToDelete.length; i++) {
        const change = rolesToDelete[i]
        onProgress?.({
          phase: 'roles',
          action: 'delete',
          name: change.name,
          current: i + 1,
          total: rolesToDelete.length,
        })

        try {
          await client.request(deleteRole(change.remote!.id!))
          result.roles.push({ type: 'deleted', name: change.name, id: change.remote!.id })
          result.summary.roles.deleted++
        }
        catch (error) {
          const message = `Failed to delete role "${change.name}": ${error}`
          result.errors.push(message)
          result.roles.push({ type: 'skipped', name: change.name, error: message })
          result.summary.roles.errors++
          result.success = false
        }
      }

      // Delete policies last
      const policiesToDelete = diff.policies.filter(p => p.type === 'removed')
      for (let i = 0; i < policiesToDelete.length; i++) {
        const change = policiesToDelete[i]
        onProgress?.({
          phase: 'policies',
          action: 'delete',
          name: change.name,
          current: i + 1,
          total: policiesToDelete.length,
        })

        try {
          await client.request(deletePolicy(change.remote!.id!))
          result.policies.push({ type: 'deleted', name: change.name, id: change.remote!.id })
          result.summary.policies.deleted++
        }
        catch (error) {
          const message = `Failed to delete policy "${change.name}": ${error}`
          result.errors.push(message)
          result.policies.push({ type: 'skipped', name: change.name, error: message })
          result.summary.policies.errors++
          result.success = false
        }
      }
    }
  }
  catch (error) {
    result.success = false
    result.errors.push(`Push failed: ${error}`)
  }

  return result
}

/**
 * Format push result as human-readable string
 */
export function formatPushResult(result: PushResult): string {
  const lines: string[] = []

  lines.push('Push Result')
  lines.push('===========')
  lines.push(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`)
  lines.push('')

  const { summary } = result

  lines.push('Summary:')
  lines.push(`  Policies: +${summary.policies.created} ~${summary.policies.updated} -${summary.policies.deleted}${summary.policies.errors ? ` (${summary.policies.errors} errors)` : ''}`)
  lines.push(`  Roles:    +${summary.roles.created} ~${summary.roles.updated} -${summary.roles.deleted}${summary.roles.errors ? ` (${summary.roles.errors} errors)` : ''}`)
  lines.push(`  Perms:    +${summary.permissions.created} ~${summary.permissions.updated} -${summary.permissions.deleted}${summary.permissions.errors ? ` (${summary.permissions.errors} errors)` : ''}`)

  if (result.errors.length > 0) {
    lines.push('')
    lines.push('Errors:')
    for (const error of result.errors) {
      lines.push(`  - ${error}`)
    }
  }

  return lines.join('\n')
}
