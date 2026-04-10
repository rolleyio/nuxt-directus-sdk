/**
 * Directus Rules DSL
 *
 * A type-safe, declarative DSL for managing Directus permissions, roles, and policies.
 *
 * @example
 * ```typescript
 * import { defineDirectusRules, createRulesTester } from 'nuxt-directus-sdk/rules'
 *
 * // Define rules using plain objects
 * const rules = defineDirectusRules<DirectusSchema>({
 *   roles: [
 *     {
 *       name: 'Editor',
 *       description: 'Content editors',
 *       policies: [
 *         {
 *           name: 'Content Management',
 *           permissions: {
 *             posts: {
 *               create: { fields: ['title', 'content'], presets: { status: 'draft' } },
 *               read: '*',
 *               update: { filter: { author: { _eq: '$CURRENT_USER' } } }
 *             }
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * })
 *
 * // Test rules
 * const tester = createRulesTester(rules)
 * expect(tester.can('Editor', 'read', 'posts').allowed).toBe(true)
 * ```
 *
 * @packageDocumentation
 */

// ============================================================================
// Core DSL
// ============================================================================

export { defineDirectusRules } from './builders'

// ============================================================================
// Loaders
// ============================================================================

export {
  loadRulesFromJson,
  loadRulesFromJsonFile,
  loadRulesFromPayload,
  loadRulesFromPayloadFile,
  rulesToJson,
} from './loaders'

export type {
  CollectionPermissionsJson,
  PermissionConfigJson,
  PolicyJson,
  RoleJson,
  RulesJson,
} from './loaders'

// ============================================================================
// Testing
// ============================================================================

export type {
  ChangeType,
  CompareOptions,
  DiffChange,
  DiffSummary,
  PermissionDiffChange,
  PolicyDiffChange,
  PushOperationResult,
  PushOptions,
  PushProgressEvent,
  PushResult,
  RoleDiffChange,
  RulesDiff,
} from './sync'

export {
  compareRulesPayloads,
  diffRemoteRules,
  diffRules,
  fetchRemoteRules,
  fetchRemoteRulesAsJson,
  formatDiff,
  formatPushResult,
  pullRules,
  pushRules,
} from './sync'

// ============================================================================
// Types
// ============================================================================

export {
  canAccessField,
  createRulesMatchers,
  createRulesTester,
  evaluateFilter,
  getAccessibleFields,
  getPresets,
} from './testing'

export type {
  MatcherResult,
  PermissionTestResult,
  RulesMatcherExtensions,
  RulesTester,
  ValidationIssue,
  ValidationTestResult,
} from './testing'

// ============================================================================
// Utilities
// ============================================================================

export type {
  // Built permission type
  BuiltPermission,
  CollectionPermissions,

  // Input types (object-based API)
  CollectionPermissionsInput,

  // Validation types
  DirectusFieldValidation,

  // API payload types
  DirectusPermissionPayload,
  DirectusPolicyPayload,
  DirectusRolePayload,
  DirectusRulesPayload,
  DirectusValidation,
  DirectusValidationRule,

  // Filter types
  DynamicValue,
  DynamicVariable,
  FilterContext,
  FilterOperators,
  LogicalFilterOperators,

  // Schema types
  PermissionAction,
  PermissionConfig,
  PermissionConfigInput,
  PermissionInput,
  PermissionsInput,
  PolicyConfig,
  PolicyInput,
  PolicyReference,
  QueryFilter,
  RelationalFilterOperators,
  RoleConfig,
  RoleInput,
  RulesConfig,
  RulesInput,

  // Standard Schema types
  StandardSchemaIssue,
  StandardSchemaProps,
  StandardSchemaResult,
  StandardSchemaV1,
} from './types'

export { isPolicyReference, isStandardSchema } from './types'

// ============================================================================
// Validation Helpers
// ============================================================================

export type {
  NormalizedRole,
  NormalizedRules,
} from './utils'

// ============================================================================
// Sync / Diff / Push
// ============================================================================

export {
  addPolicyToRole,
  createAdminPolicy,
  createAdminPolicyConfig,
  createPolicy,
  extendRules,
  mergeRules,
  normalizeRules,
  policyPermissionsToObject,
  serializeToDirectusApi,
  serializeToJson,
} from './utils'

export {
  allOf,
  directusValidation,
  field,
  isValidationStandardSchema,
  length,
  oneOf,
  oneOfValues,
  pattern,
  required,
  toDirectusValidation,
} from './validation'
