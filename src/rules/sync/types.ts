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
  toString: () => string
}

// ============================================================================
// Push Types
// ============================================================================

/** Options for pushing rules to Directus */
export interface PushOptions {
  /**
   * If true, only add new items - don't modify or delete existing ones.
   * Useful for safely adding new roles/policies without affecting existing config.
   * @default false
   */
  addOnly?: boolean

  /**
   * If true, skip deleting items that exist remotely but not locally.
   * @default false
   */
  skipDeletes?: boolean

  /**
   * Callback for progress updates during push
   */
  onProgress?: (event: PushProgressEvent) => void
}

/** Progress event during push */
export interface PushProgressEvent {
  phase: 'policies' | 'roles' | 'permissions'
  action: 'create' | 'update' | 'delete'
  name: string
  current: number
  total: number
}

/** Result of a single push operation */
export interface PushOperationResult {
  type: 'created' | 'updated' | 'deleted' | 'skipped'
  name: string
  id?: string
  error?: string
}

/** Result of pushing rules */
export interface PushResult {
  success: boolean
  roles: PushOperationResult[]
  policies: PushOperationResult[]
  permissions: PushOperationResult[]

  /** Summary counts */
  summary: {
    roles: { created: number, updated: number, deleted: number, errors: number }
    policies: { created: number, updated: number, deleted: number, errors: number }
    permissions: { created: number, updated: number, deleted: number, errors: number }
  }

  /** Any errors that occurred */
  errors: string[]
}
