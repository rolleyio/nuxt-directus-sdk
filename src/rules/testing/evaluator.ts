/**
 * Filter evaluation engine for testing permissions
 *
 * Evaluates Directus filters against items without API calls,
 * enabling unit testing of permission rules.
 */

import type { FilterContext } from '../types'

/**
 * Evaluate a Directus filter against an item
 *
 * @param filter - The Directus filter object
 * @param item - The item to test against
 * @param context - Context for resolving dynamic variables
 * @returns true if the item matches the filter
 *
 * @example
 * ```typescript
 * const filter = { author: { _eq: '$CURRENT_USER' } }
 * const item = { id: 1, author: 'user-123', title: 'Test' }
 *
 * evaluateFilter(filter, item, { currentUser: 'user-123' }) // true
 * evaluateFilter(filter, item, { currentUser: 'user-456' }) // false
 * ```
 */
export function evaluateFilter<T extends Record<string, unknown>>(
  filter: Record<string, unknown> | null | undefined,
  item: T,
  context: FilterContext = {},
): boolean {
  if (!filter || Object.keys(filter).length === 0) {
    return true
  }

  // Handle logical operators
  if ('_and' in filter && Array.isArray(filter._and)) {
    return filter._and.every((f: Record<string, unknown>) =>
      evaluateFilter(f, item, context),
    )
  }

  if ('_or' in filter && Array.isArray(filter._or)) {
    return filter._or.some((f: Record<string, unknown>) =>
      evaluateFilter(f, item, context),
    )
  }

  // Handle field filters
  for (const [field, condition] of Object.entries(filter)) {
    if (field.startsWith('_'))
      continue // Skip logical operators

    // Handle nested field access (e.g., "author.name")
    const itemValue = getNestedValue(item, field)

    if (!evaluateCondition(itemValue, condition, context)) {
      return false
    }
  }

  return true
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    }
    else {
      return undefined
    }
  }

  return current
}

/**
 * Evaluate a condition against a value
 */
function evaluateCondition(
  itemValue: unknown,
  condition: unknown,
  context: FilterContext,
): boolean {
  // If condition is a simple value, treat as _eq
  if (typeof condition !== 'object' || condition === null) {
    return itemValue === resolveDynamicValue(condition, context)
  }

  const conditionObj = condition as Record<string, unknown>

  // Handle nested object filter (for relations)
  if (!hasOperator(conditionObj)) {
    // This is a nested object filter
    if (typeof itemValue !== 'object' || itemValue === null) {
      return false
    }
    return evaluateFilter(conditionObj, itemValue as Record<string, unknown>, context)
  }

  // Handle operators
  for (const [op, value] of Object.entries(conditionObj)) {
    const resolvedValue = resolveDynamicValue(value, context)

    if (!evaluateOperator(op, itemValue, resolvedValue, context)) {
      return false
    }
  }

  return true
}

/**
 * Check if an object contains filter operators
 */
function hasOperator(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).some(key => key.startsWith('_'))
}

/**
 * Evaluate a single operator
 */
function evaluateOperator(
  op: string,
  itemValue: unknown,
  resolvedValue: unknown,
  context: FilterContext,
): boolean {
  switch (op) {
    case '_eq':
      return itemValue === resolvedValue

    case '_neq':
      return itemValue !== resolvedValue

    case '_gt':
      return typeof itemValue === 'number' && typeof resolvedValue === 'number'
        ? itemValue > resolvedValue
        : String(itemValue) > String(resolvedValue)

    case '_gte':
      return typeof itemValue === 'number' && typeof resolvedValue === 'number'
        ? itemValue >= resolvedValue
        : String(itemValue) >= String(resolvedValue)

    case '_lt':
      return typeof itemValue === 'number' && typeof resolvedValue === 'number'
        ? itemValue < resolvedValue
        : String(itemValue) < String(resolvedValue)

    case '_lte':
      return typeof itemValue === 'number' && typeof resolvedValue === 'number'
        ? itemValue <= resolvedValue
        : String(itemValue) <= String(resolvedValue)

    case '_in':
      return Array.isArray(resolvedValue) && resolvedValue.includes(itemValue)

    case '_nin':
      return Array.isArray(resolvedValue) && !resolvedValue.includes(itemValue)

    case '_null':
      return resolvedValue ? itemValue === null : itemValue !== null

    case '_nnull':
      return resolvedValue ? itemValue !== null : itemValue === null

    case '_empty':
      if (resolvedValue) {
        return itemValue === null || itemValue === undefined || itemValue === ''
          || (Array.isArray(itemValue) && itemValue.length === 0)
      }
      return itemValue !== null && itemValue !== undefined && itemValue !== ''
        && !(Array.isArray(itemValue) && itemValue.length === 0)

    case '_nempty':
      if (resolvedValue) {
        return itemValue !== null && itemValue !== undefined && itemValue !== ''
          && !(Array.isArray(itemValue) && itemValue.length === 0)
      }
      return itemValue === null || itemValue === undefined || itemValue === ''
        || (Array.isArray(itemValue) && itemValue.length === 0)

    case '_contains':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && itemValue.includes(resolvedValue)

    case '_ncontains':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && !itemValue.includes(resolvedValue)

    case '_icontains':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && itemValue.toLowerCase().includes(resolvedValue.toLowerCase())

    case '_starts_with':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && itemValue.startsWith(resolvedValue)

    case '_istarts_with':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && itemValue.toLowerCase().startsWith(resolvedValue.toLowerCase())

    case '_nstarts_with':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && !itemValue.startsWith(resolvedValue)

    case '_nistarts_with':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && !itemValue.toLowerCase().startsWith(resolvedValue.toLowerCase())

    case '_ends_with':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && itemValue.endsWith(resolvedValue)

    case '_iends_with':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && itemValue.toLowerCase().endsWith(resolvedValue.toLowerCase())

    case '_nends_with':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && !itemValue.endsWith(resolvedValue)

    case '_niends_with':
      return typeof itemValue === 'string'
        && typeof resolvedValue === 'string'
        && !itemValue.toLowerCase().endsWith(resolvedValue.toLowerCase())

    case '_between':
      if (Array.isArray(resolvedValue) && resolvedValue.length === 2) {
        const [min, max] = resolvedValue
        return itemValue !== null
          && itemValue !== undefined
          && itemValue >= min
          && itemValue <= max
      }
      return false

    case '_nbetween':
      if (Array.isArray(resolvedValue) && resolvedValue.length === 2) {
        const [min, max] = resolvedValue
        return itemValue === null
          || itemValue === undefined
          || itemValue < min
          || itemValue > max
      }
      return true

    case '_regex':
      if (typeof itemValue !== 'string' || typeof resolvedValue !== 'string') {
        return false
      }
      try {
        const regex = new RegExp(resolvedValue)
        return regex.test(itemValue)
      }
      catch {
        return false
      }

    // Relational operators
    case '_some':
      if (!Array.isArray(itemValue))
        return false
      return itemValue.some(v =>
        evaluateFilter(resolvedValue as Record<string, unknown>, v as Record<string, unknown>, context),
      )

    case '_none':
      if (!Array.isArray(itemValue))
        return true
      return !itemValue.some(v =>
        evaluateFilter(resolvedValue as Record<string, unknown>, v as Record<string, unknown>, context),
      )

    default:
      // Unknown operator - treat as nested field
      console.warn(`Unknown filter operator: ${op}`)
      return true
  }
}

/**
 * Resolve dynamic variables in filter values
 */
function resolveDynamicValue(value: unknown, context: FilterContext): unknown {
  if (typeof value !== 'string')
    return value

  switch (value) {
    case '$CURRENT_USER':
      return context.currentUser ?? 'test-user-id'

    case '$CURRENT_ROLE':
      return context.currentRole ?? 'test-role-id'

    case '$CURRENT_ROLES':
      return context.currentRoles ?? ['test-role-id']

    case '$NOW':
      return (context.now ?? new Date()).toISOString()

    default:
      return value
  }
}
