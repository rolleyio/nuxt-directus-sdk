/**
 * Core schema types for the Directus Rules DSL
 */

import type { QueryFilter } from '@directus/sdk'
import type { DirectusValidation, StandardSchemaV1 } from './validation'

/**
 * Helper type to extract the item type from a collection
 * Handles both array collections (posts: Post[]) and single collections (posts: Post)
 */
export type CollectionItem<Schema, K extends keyof Schema> =
  Schema[K] extends Array<infer Item> ? Item : Schema[K]

/**
 * Permission actions supported by Directus
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share'

/**
 * Configuration for a single permission action
 */
export interface PermissionConfig<Schema, Collection extends keyof Schema> {
  /** Fields that can be accessed. '*' for all, array for specific fields */
  fields?: '*' | (keyof CollectionItem<Schema, Collection>)[]
  /** Filter that restricts which items can be accessed */
  filter?: QueryFilter<Schema, CollectionItem<Schema, Collection>>
  /** Default values applied when creating/updating items */
  presets?: Partial<CollectionItem<Schema, Collection>>
  /** Validation rules using Standard Schema or Directus format */
  validation?: StandardSchemaV1<Partial<CollectionItem<Schema, Collection>>> | DirectusValidation
}

/**
 * Collection permissions mapping actions to their configurations
 */
export interface CollectionPermissions<Schema, Collection extends keyof Schema> {
  create?: PermissionConfig<Schema, Collection> | boolean
  read?: PermissionConfig<Schema, Collection> | boolean
  update?: PermissionConfig<Schema, Collection> | boolean
  delete?: PermissionConfig<Schema, Collection> | boolean
  share?: PermissionConfig<Schema, Collection> | boolean
}

/**
 * Policy configuration - defines a reusable set of permissions
 */
export interface PolicyConfig<Schema> {
  /** Unique identifier for the policy */
  id?: string
  /** Display name */
  name: string
  /** Icon name (Material Design icon) */
  icon?: string
  /** Description of what this policy grants */
  description?: string
  /** IP addresses allowed to use this policy */
  ipAccess?: string[]
  /** Whether to enforce two-factor authentication */
  enforceTfa?: boolean
  /** Whether this grants admin access */
  adminAccess?: boolean
  /** Whether this grants app (Directus UI) access */
  appAccess?: boolean
  /** Permissions for each collection */
  permissions: Map<keyof Schema, CollectionPermissions<Schema, keyof Schema>>
}

/**
 * Role configuration - defines a user role with attached policies
 */
export interface RoleConfig<Schema> {
  /** Unique identifier for the role */
  id?: string
  /** Display name */
  name: string
  /** Icon name (Material Design icon) */
  icon?: string
  /** Description of the role */
  description?: string
  /** Parent role for inheritance */
  parent?: string
  /** Policies attached to this role */
  policies: PolicyConfig<Schema>[]
  /**
   * Original policy IDs from Directus API (internal use only).
   * Used to preserve policy references that couldn't be resolved during loading.
   * @internal
   */
  _originalPolicyIds?: string[]
}

/**
 * Complete rules configuration
 */
export interface RulesConfig<Schema> {
  /** Defined roles */
  roles: RoleConfig<Schema>[]
  /** Standalone policies (can be attached to users directly) */
  policies: PolicyConfig<Schema>[]
}

/**
 * Internal representation of a built permission for a single action
 */
export interface BuiltPermission<Schema, Collection extends keyof Schema> {
  collection: Collection
  action: PermissionAction
  fields: '*' | (keyof CollectionItem<Schema, Collection>)[] | null
  filter: QueryFilter<Schema, CollectionItem<Schema, Collection>> | null
  presets: Partial<CollectionItem<Schema, Collection>> | null
  validation: DirectusValidation | null
}

// ============================================================================
// Input Types (what users write - object-based API)
// ============================================================================

/**
 * Input type for defining rules using plain objects
 *
 * @example
 * ```typescript
 * const rules = defineDirectusRules<Schema>({
 *   roles: [{
 *     name: 'Editor',
 *     policies: [{
 *       name: 'Content',
 *       permissions: {
 *         posts: { read: true, update: { fields: ['title'] } }
 *       }
 *     }]
 *   }]
 * })
 * ```
 */
export interface RulesInput<Schema> {
  /** Defined roles */
  roles?: RoleInput<Schema>[]
  /** Standalone policies (can be attached to users directly) */
  policies?: PolicyInput<Schema>[]
}

/**
 * Reference to a standalone policy by ID
 *
 * Use this to reuse a policy defined in the top-level `policies` array
 * across multiple roles.
 *
 * @example
 * ```typescript
 * const rules = defineDirectusRules<Schema>({
 *   policies: [{ id: 'shared', name: 'Shared', permissions: {...} }],
 *   roles: [{
 *     name: 'Editor',
 *     policies: [{ id: 'shared' }]  // Reference by ID
 *   }]
 * })
 * ```
 */
export interface PolicyReference {
  /** The ID of the policy to reference */
  id: string
}

/**
 * Type guard to check if input is a policy reference (vs inline policy)
 */
export function isPolicyReference<Schema>(
  input: PolicyInput<Schema> | PolicyReference,
): input is PolicyReference {
  return 'id' in input && !('name' in input)
}

/**
 * Input type for role definition
 */
export interface RoleInput<Schema> {
  /** Unique identifier for the role */
  id?: string
  /** Display name */
  name: string
  /** Icon name (Material Design icon) */
  icon?: string
  /** Description of the role */
  description?: string
  /** Parent role for inheritance */
  parent?: string
  /** Policies attached to this role - can be inline policies or references to standalone policies */
  policies: (PolicyInput<Schema> | PolicyReference)[]
}

/**
 * Input type for policy definition
 */
export interface PolicyInput<Schema> {
  /** Unique identifier for the policy */
  id?: string
  /** Display name */
  name: string
  /** Icon name (Material Design icon) */
  icon?: string
  /** Description of what this policy grants */
  description?: string
  /** IP addresses allowed to use this policy */
  ipAccess?: string[]
  /** Whether to enforce two-factor authentication */
  enforceTfa?: boolean
  /** Whether this grants admin access */
  adminAccess?: boolean
  /** Whether this grants app (Directus UI) access */
  appAccess?: boolean
  /** Permissions for each collection (object notation) */
  permissions: PermissionsInput<Schema>
}

/**
 * Object notation for permissions (instead of Map)
 */
export type PermissionsInput<Schema> = {
  [K in keyof Schema]?: CollectionPermissionsInput<Schema, K>
}

/**
 * Input type for collection permissions
 */
export interface CollectionPermissionsInput<Schema, K extends keyof Schema> {
  create?: PermissionInput<Schema, K>
  read?: PermissionInput<Schema, K>
  update?: PermissionInput<Schema, K>
  delete?: PermissionInput<Schema, K>
  share?: PermissionInput<Schema, K>
}

/**
 * Permission input - supports shorthand values
 *
 * - `true` - Allow full access
 * - `false` - Deny access
 * - `'*'` - Allow access to all fields (equivalent to { fields: '*' })
 * - `{ fields, filter, presets, validation }` - Detailed configuration
 */
export type PermissionInput<Schema, K extends keyof Schema> =
  | boolean
  | '*'
  | PermissionConfigInput<Schema, K>

/**
 * Detailed permission configuration input
 */
export interface PermissionConfigInput<Schema, K extends keyof Schema> {
  /** Fields that can be accessed. '*' for all, array for specific fields */
  fields?: '*' | (keyof CollectionItem<Schema, K>)[]
  /** Filter that restricts which items can be accessed */
  filter?: QueryFilter<Schema, CollectionItem<Schema, K>>
  /** Default values applied when creating/updating items */
  presets?: Partial<CollectionItem<Schema, K>>
  /** Validation rules using Standard Schema or Directus format */
  validation?: StandardSchemaV1<Partial<CollectionItem<Schema, K>>> | DirectusValidation
}
