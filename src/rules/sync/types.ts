/**
 * Types for the Directus Rules sync/diff engine
 */

import type {
  DirectusPermissionPayload,
  DirectusPolicyPayload,
  DirectusRolePayload,
} from '../types/directus-api'
import type { PermissionAction } from '../types/schema'

/** Type of change detected */
export type ChangeType = 'added' | 'modified' | 'removed' | 'unchanged'

/** A single change in the diff */
export interface DiffChange<T> {
  type: ChangeType
  id?: string
  name: string
  /** Present for 'added', 'modified', and 'unchanged' */
  local?: T
  /** Present for 'removed', 'modified', and 'unchanged' */
  remote?: T
}

/** Role diff change */
export interface RoleDiffChange extends DiffChange<DirectusRolePayload> {}

/** Policy diff change */
export interface PolicyDiffChange extends DiffChange<DirectusPolicyPayload> {}

/** Permission diff change */
export interface PermissionDiffChange extends DiffChange<DirectusPermissionPayload> {
  collection: string
  action: PermissionAction
  policyId?: string
}

/** Summary counts for a category */
export interface DiffSummary {
  added: number
  modified: number
  removed: number
}

/** Complete diff result */
export interface RulesDiff {
  roles: RoleDiffChange[]
  policies: PolicyDiffChange[]
  permissions: PermissionDiffChange[]

  /** True if any changes exist */
  hasChanges: boolean

  /** Summary counts */
  summary: {
    roles: DiffSummary
    policies: DiffSummary
    permissions: DiffSummary
  }

  /** Generate human-readable diff string */
  toString(): string
}
