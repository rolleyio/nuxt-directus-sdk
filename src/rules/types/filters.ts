/**
 * Filter types for the Directus Rules DSL
 *
 * Re-exports from @directus/sdk plus additional helpers for dynamic variables
 */

// Re-export core filter types from SDK
export type {
  FilterOperators,
  LogicalFilterOperators,
  QueryFilter,
  RelationalFilterOperators,
} from '@directus/sdk'

/**
 * Dynamic filter variables supported by Directus
 * These are evaluated at runtime based on the current user/context
 */
export type DynamicVariable
  = | '$CURRENT_USER'
    | '$CURRENT_ROLE'
    | '$CURRENT_ROLES'
    | '$NOW'

/**
 * Type helper for filters that use dynamic variables
 * Allows string values that are Directus dynamic variables
 */
export type DynamicValue<T> = T | DynamicVariable

/**
 * Context for evaluating dynamic variables in tests
 */
export interface FilterContext {
  /** Current user ID (for $CURRENT_USER) */
  currentUser?: string
  /** Current role ID (for $CURRENT_ROLE) */
  currentRole?: string
  /** All current role IDs (for $CURRENT_ROLES) */
  currentRoles?: string[]
  /** Current timestamp (for $NOW) */
  now?: Date
}
