/**
 * Types for Directus API payloads
 * Used when serializing rules for push operations (future sync feature)
 */

import type { PermissionAction } from './schema'
import type { DirectusValidation } from './validation'

/**
 * Directus permission payload for API operations
 */
export interface DirectusPermissionPayload {
  id?: number
  policy?: string | null
  collection: string
  action: PermissionAction
  permissions: Record<string, unknown> | null
  validation: DirectusValidation | null
  presets: Record<string, unknown> | null
  fields: string[] | null
}

/**
 * Directus policy payload for API operations
 */
export interface DirectusPolicyPayload {
  id?: string
  name: string
  icon: string
  description: string | null
  ip_access: string | null
  enforce_tfa: boolean
  admin_access: boolean
  app_access: boolean
}

/**
 * Directus role payload for API operations
 */
export interface DirectusRolePayload {
  id?: string
  name: string
  icon: string
  description: string | null
  parent: string | null
  /** Policy IDs attached to this role */
  policies?: string[]
}

/**
 * Complete API payload for syncing rules
 */
export interface DirectusRulesPayload {
  roles: DirectusRolePayload[]
  policies: DirectusPolicyPayload[]
  permissions: DirectusPermissionPayload[]
}
