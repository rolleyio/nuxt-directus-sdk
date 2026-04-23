/**
 * Formatting utilities for diff output
 */

import type { DiffChange, PermissionDiffChange, RulesDiff } from './types'

/**
 * Format diff as human-readable string (git-style)
 *
 * @example
 * ```typescript
 * const diff = compareRulesPayloads(local, remote)
 * console.log(formatDiff(diff))
 * ```
 *
 * Output:
 * ```
 * Rules Diff Summary
 * ==================
 * Roles:       +1  ~0  -0
 * Policies:    +1  ~1  -0
 * Permissions: +3  ~2  -1
 *
 * + Role: Editor
 *   icon: badge
 *   description: Content editors
 *
 * ~ Policy: Content Management
 *   app_access:
 *     - false
 *     + true
 *
 * + Permission: posts.create (policy: content-mgmt)
 * - Permission: legacy.read (policy: old-policy)
 * ```
 */
export function formatDiff(diff: RulesDiff): string {
  const lines: string[] = []

  // Summary header
  lines.push('Rules Diff Summary')
  lines.push('==================')
  lines.push(formatSummaryLine('Roles', diff.summary.roles))
  lines.push(formatSummaryLine('Policies', diff.summary.policies))
  lines.push(formatSummaryLine('Permissions', diff.summary.permissions))

  // If no changes, indicate that
  if (!diff.hasChanges) {
    lines.push('')
    lines.push('No changes detected.')
    return lines.join('\n')
  }

  lines.push('')

  // Role changes
  for (const change of diff.roles) {
    if (change.type !== 'unchanged') {
      formatRoleChange(lines, change)
    }
  }

  // Policy changes
  for (const change of diff.policies) {
    if (change.type !== 'unchanged') {
      formatPolicyChange(lines, change)
    }
  }

  // Permission changes (grouped by collection)
  const permsByCollection = groupPermissionsByCollection(
    diff.permissions.filter(p => p.type !== 'unchanged'),
  )

  for (const [collection, perms] of permsByCollection) {
    lines.push(`# ${collection}`)
    for (const perm of perms) {
      formatPermissionChange(lines, perm)
    }
    lines.push('')
  }

  return lines.join('\n').trim()
}

/**
 * Format a summary line with aligned columns
 */
function formatSummaryLine(
  label: string,
  counts: { added: number, modified: number, removed: number },
): string {
  const padded = label.padEnd(12)
  return `${padded} +${counts.added}  ~${counts.modified}  -${counts.removed}`
}

/**
 * Format a role change
 */
// TODO: (eslint) revisit any types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatRoleChange(lines: string[], change: DiffChange<any>): void {
  const prefix = changePrefix(change.type)
  lines.push(`${prefix} Role: ${change.name}`)

  if (change.type === 'added' && change.local) {
    formatAddedFields(lines, change.local, ['name'])
  }
  else if (change.type === 'modified' && change.local && change.remote) {
    formatModifiedFields(lines, change.local, change.remote, ['name'])
  }

  lines.push('')
}

/**
 * Format a policy change
 */
// TODO: (eslint) revisit any types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatPolicyChange(lines: string[], change: DiffChange<any>): void {
  const prefix = changePrefix(change.type)
  lines.push(`${prefix} Policy: ${change.name}`)

  if (change.type === 'added' && change.local) {
    formatAddedFields(lines, change.local, ['name'])
  }
  else if (change.type === 'modified' && change.local && change.remote) {
    formatModifiedFields(lines, change.local, change.remote, ['name'])
  }

  lines.push('')
}

/**
 * Format a permission change
 */
function formatPermissionChange(lines: string[], change: PermissionDiffChange): void {
  const prefix = changePrefix(change.type)
  const policyInfo = change.policyId ? ` (policy: ${change.policyId})` : ''
  lines.push(`${prefix} ${change.collection}.${change.action}${policyInfo}`)

  if (change.type === 'modified' && change.local && change.remote) {
    formatModifiedFields(lines, change.local, change.remote, ['collection', 'action', 'policy', 'id'])
  }
}

/**
 * Get the prefix character for a change type
 */
function changePrefix(type: string): string {
  switch (type) {
    case 'added':
      return '+'
    case 'removed':
      return '-'
    case 'modified':
      return '~'
    default:
      return ' '
  }
}

/**
 * Format fields for an added item
 */
function formatAddedFields(
  lines: string[],
  item: Record<string, unknown>,
  excludeKeys: string[],
): void {
  for (const [key, value] of Object.entries(item)) {
    if (excludeKeys.includes(key))
      continue
    if (value === null || value === undefined)
      continue

    lines.push(`  ${key}: ${formatValue(value)}`)
  }
}

/**
 * Format field-level changes for a modified item
 */
function formatModifiedFields(
  lines: string[],
  local: Record<string, unknown>,
  remote: Record<string, unknown>,
  excludeKeys: string[],
): void {
  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)])

  for (const key of allKeys) {
    if (excludeKeys.includes(key))
      continue

    const localVal = local[key]
    const remoteVal = remote[key]

    if (!valuesEqual(localVal, remoteVal)) {
      lines.push(`  ${key}:`)
      lines.push(`    - ${formatValue(remoteVal)}`)
      lines.push(`    + ${formatValue(localVal)}`)
    }
  }
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null'
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value)
  }
  return JSON.stringify(value)
}

/**
 * Check if two values are equal (for diff purposes)
 */
function valuesEqual(a: unknown, b: unknown): boolean {
  // Normalize null/undefined
  const normalizedA = a === undefined ? null : a
  const normalizedB = b === undefined ? null : b

  return JSON.stringify(normalizedA) === JSON.stringify(normalizedB)
}

/**
 * Group permissions by collection for better readability
 */
function groupPermissionsByCollection(
  permissions: PermissionDiffChange[],
): Map<string, PermissionDiffChange[]> {
  const grouped = new Map<string, PermissionDiffChange[]>()

  for (const perm of permissions) {
    const existing = grouped.get(perm.collection) ?? []
    existing.push(perm)
    grouped.set(perm.collection, existing)
  }

  return grouped
}
