/**
 * Rules tester - main testing interface
 */

import type {
  DirectusValidation,
  FilterContext,
  PermissionAction,
  PermissionConfig,
  PolicyConfig,
  RulesConfig,
  StandardSchemaV1,
} from '../types'
import { isStandardSchema } from '../types'
import { evaluateFilter } from './evaluator'
import { canAccessField, getAccessibleFields, getPresets } from './field-checker'

/**
 * Result of a permission check
 */
export interface PermissionTestResult<Schema, Collection extends keyof Schema> {
  /** Whether the permission is allowed */
  allowed: boolean
  /** The matching permission config (if allowed) */
  permission?: PermissionConfig<Schema, Collection>
  /** Explanation of why access was granted or denied */
  reason?: string
}

/**
 * Result of a validation check
 */
export interface ValidationTestResult {
  /** Whether the item passed validation */
  valid: boolean
  /** Validation issues found */
  issues: ValidationIssue[]
}

/**
 * A single validation issue
 */
export interface ValidationIssue {
  /** Field that failed validation */
  field: string
  /** Error message */
  message: string
}

/**
 * Rules tester interface
 */
export interface RulesTester<Schema> {
  /**
   * Check if a role/policy allows an action on a collection
   */
  can: <K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
  ) => PermissionTestResult<Schema, K>

  /**
   * Check if an item matches the filter for a permission
   */
  itemMatchesFilter: <K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
    item: Schema[K],
    context?: FilterContext,
  ) => boolean

  /**
   * Get accessible fields for a permission
   */
  getAccessibleFields: <K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
  ) => (keyof Schema[K])[] | '*'

  /**
   * Check if a specific field is accessible
   */
  canAccessField: <K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
    field: keyof Schema[K],
  ) => boolean

  /**
   * Get presets for a permission
   */
  getPresets: <K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
  ) => Partial<Schema[K]> | null

  /**
   * Validate an item against permission validation rules
   */
  validateItem: <K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
    item: Partial<Schema[K]>,
  ) => Promise<ValidationTestResult>

  /**
   * Get the underlying rules config
   */
  getRules: () => RulesConfig<Schema>
}

/**
 * Create a rules tester for testing permissions
 *
 * @example
 * ```typescript
 * import { createRulesTester } from 'nuxt-directus-sdk/rules'
 *
 * const tester = createRulesTester(rules)
 *
 * // Test if Editor can read posts
 * const result = tester.can('Editor', 'read', 'posts')
 * expect(result.allowed).toBe(true)
 *
 * // Test if an item matches the filter
 * const item = { id: 1, author: 'user-123' }
 * const matches = tester.itemMatchesFilter('Editor', 'update', 'posts', item, {
 *   currentUser: 'user-123'
 * })
 * expect(matches).toBe(true)
 * ```
 */
export function createRulesTester<Schema>(rules: RulesConfig<Schema>): RulesTester<Schema> {
  return new RulesTesterImpl(rules)
}

/**
 * Implementation of RulesTester
 */
class RulesTesterImpl<Schema> implements RulesTester<Schema> {
  private readonly rules: RulesConfig<Schema>

  constructor(rules: RulesConfig<Schema>) {
    this.rules = rules
  }

  can<K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
  ): PermissionTestResult<Schema, K> {
    const policies = this.getPoliciesFor(roleOrPolicy)

    if (!policies.length) {
      return {
        allowed: false,
        reason: `Role or policy "${roleOrPolicy}" not found`,
      }
    }

    for (const policy of policies) {
      // Admin access bypasses all permissions
      if (policy.adminAccess) {
        return {
          allowed: true,
          reason: 'Admin access granted',
        }
      }

      const collectionPerms = policy.permissions.get(collection)
      if (!collectionPerms) continue

      const perm = collectionPerms[action]

      if (perm === true) {
        return {
          allowed: true,
          reason: `Full ${action} access on ${String(collection)}`,
        }
      }

      if (perm === false) {
        continue // Check other policies
      }

      if (perm && typeof perm === 'object') {
        return {
          allowed: true,
          permission: perm as PermissionConfig<Schema, K>, // eslint-disable-line typescript/no-unsafe-type-assertion -- narrowed via typeof check, generic K mismatch
          reason: `Conditional ${action} access on ${String(collection)}`,
        }
      }
    }

    return {
      allowed: false,
      reason: `No ${action} permission for ${String(collection)} in "${roleOrPolicy}"`,
    }
  }

  itemMatchesFilter<K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
    item: Schema[K],
    context: FilterContext = {},
  ): boolean {
    const result = this.can(roleOrPolicy, action, collection)

    if (!result.allowed) {
      return false
    }

    // No filter = all items match
    if (!result.permission?.filter) {
      return true
    }

    return evaluateFilter(
      result.permission.filter as Record<string, unknown>, // eslint-disable-line typescript/no-unsafe-type-assertion -- generic filter to evaluator format
      item as Record<string, unknown>, // eslint-disable-line typescript/no-unsafe-type-assertion -- generic Schema[K] to evaluator format
      context,
    )
  }

  getAccessibleFields<K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
  ): (keyof Schema[K])[] | '*' {
    return getAccessibleFields(this.rules, roleOrPolicy, action, collection)
  }

  canAccessField<K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
    field: keyof Schema[K],
  ): boolean {
    return canAccessField(this.rules, roleOrPolicy, action, collection, field)
  }

  getPresets<K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
  ): Partial<Schema[K]> | null {
    return getPresets(this.rules, roleOrPolicy, action, collection)
  }

  async validateItem<K extends keyof Schema>(
    roleOrPolicy: string,
    action: PermissionAction,
    collection: K,
    item: Partial<Schema[K]>,
  ): Promise<ValidationTestResult> {
    const result = this.can(roleOrPolicy, action, collection)

    if (!result.allowed) {
      return {
        valid: false,
        issues: [{ field: '*', message: 'Permission denied' }],
      }
    }

    if (!result.permission?.validation) {
      return { valid: true, issues: [] }
    }

    const validation = result.permission.validation

    // Check if it's a Standard Schema
    if (isStandardSchema(validation)) {
      return await validateWithStandardSchema(validation, item)
    }

    // Otherwise, it's Directus validation format
    return validateWithDirectusFormat(validation, item)
  }

  getRules(): RulesConfig<Schema> {
    return this.rules
  }

  private getPoliciesFor(roleOrPolicy: string): PolicyConfig<Schema>[] {
    // Check if it's a role
    const role = this.rules.roles.find((r) => r.name === roleOrPolicy)
    if (role) {
      return role.policies
    }

    // Check standalone policies
    const standalonePolicy = this.rules.policies.find((p) => p.name === roleOrPolicy)
    if (standalonePolicy) {
      return [standalonePolicy]
    }

    // Check policies within roles
    for (const r of this.rules.roles) {
      const policy = r.policies.find((p) => p.name === roleOrPolicy)
      if (policy) {
        return [policy]
      }
    }

    return []
  }
}

/**
 * Validate with Standard Schema
 */
async function validateWithStandardSchema<T>(
  schema: StandardSchemaV1<T>,
  item: unknown,
): Promise<ValidationTestResult> {
  try {
    const result = await schema['~standard'].validate(item)

    if (result.issues && result.issues.length > 0) {
      return {
        valid: false,
        issues: result.issues.map((issue) => ({
          field: issue.path?.join('.') ?? '*',
          message: issue.message,
        })),
      }
    }

    return { valid: true, issues: [] }
  } catch (error) {
    return {
      valid: false,
      issues: [
        {
          field: '*',
          message: error instanceof Error ? error.message : 'Validation failed',
        },
      ],
    }
  }
}

/**
 * Validate with Directus format
 */
function validateWithDirectusFormat(
  validation: DirectusValidation,
  item: Record<string, unknown>,
): ValidationTestResult {
  const issues: ValidationIssue[] = []

  // Handle _and
  if (validation._and && Array.isArray(validation._and)) {
    for (const rule of validation._and) {
      const subResult = validateWithDirectusFormat(rule as DirectusValidation, item)
      issues.push(...subResult.issues)
    }
  }

  // Handle _or
  if (validation._or && Array.isArray(validation._or)) {
    const orResults = validation._or.map((rule) =>
      validateWithDirectusFormat(rule as DirectusValidation, item),
    )
    // _or passes if at least one passes
    const anyPassed = orResults.some((r) => r.valid)
    if (!anyPassed && orResults.length > 0) {
      // Collect all issues from the first failing rule
      issues.push(...orResults[0]!.issues)
    }
  }

  // Handle field validations
  for (const [field, rules] of Object.entries(validation)) {
    if (field.startsWith('_')) continue // Skip logical operators

    const fieldValue = item[field]
    const fieldRules = rules as Record<string, unknown> // eslint-disable-line typescript/no-unsafe-type-assertion -- DirectusValidation index signature

    for (const [rule, expected] of Object.entries(fieldRules)) {
      const error = validateFieldRule(field, fieldValue, rule, expected)
      if (error) {
        issues.push(error)
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Validate a single field rule
 */
function validateFieldRule(
  field: string,
  value: unknown,
  rule: string,
  expected: unknown,
): ValidationIssue | null {
  switch (rule) {
    case '_nnull':
      if (expected && (value === null || value === undefined)) {
        return { field, message: `${field} is required` }
      }
      break

    case '_null':
      if (expected && value !== null) {
        return { field, message: `${field} must be null` }
      }
      break

    case '_eq':
      if (value !== expected) {
        return { field, message: `${field} must equal ${String(expected)}` }
      }
      break

    case '_neq':
      if (value === expected) {
        return { field, message: `${field} must not equal ${String(expected)}` }
      }
      break

    case '_in':
      if (Array.isArray(expected) && !expected.includes(value)) {
        return { field, message: `${field} must be one of: ${expected.join(', ')}` }
      }
      break

    case '_nin':
      if (Array.isArray(expected) && expected.includes(value)) {
        return { field, message: `${field} must not be one of: ${expected.join(', ')}` }
      }
      break

    case '_gt':
      if (typeof value === 'number' && typeof expected === 'number' && !(value > expected)) {
        return { field, message: `${field} must be greater than ${expected}` }
      }
      break

    case '_gte':
      if (typeof value === 'number' && typeof expected === 'number' && !(value >= expected)) {
        return { field, message: `${field} must be greater than or equal to ${expected}` }
      }
      break

    case '_lt':
      if (typeof value === 'number' && typeof expected === 'number' && !(value < expected)) {
        return { field, message: `${field} must be less than ${expected}` }
      }
      break

    case '_lte':
      if (typeof value === 'number' && typeof expected === 'number' && !(value <= expected)) {
        return { field, message: `${field} must be less than or equal to ${expected}` }
      }
      break

    case '_regex':
      if (typeof value === 'string' && typeof expected === 'string') {
        try {
          const regex = new RegExp(expected)
          if (!regex.test(value)) {
            return { field, message: `${field} does not match required pattern` }
          }
        } catch {
          return { field, message: `Invalid regex pattern for ${field}` }
        }
      }
      break

    case '_submitted':
      if (expected && value === undefined) {
        return { field, message: `${field} must be submitted` }
      }
      break
  }

  return null
}
