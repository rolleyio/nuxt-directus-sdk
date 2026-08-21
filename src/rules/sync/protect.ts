/**
 * Entities that must never be deleted by rules sync, even when the local
 * payload is a partial hand-authored set and skipDeletes is false.
 */

import type { DirectusPolicyPayload, DirectusRolePayload } from '../types/directus-api'

/** Role names that are Directus defaults / infrastructure. */
const PROTECTED_ROLE_NAMES = new Set([
  'Administrator',
  'Public',
  '$t:public_label',
])

/** Policy names that are Directus defaults / infrastructure. */
const PROTECTED_POLICY_NAMES = new Set([
  'Administrator',
  'Public',
  '$t:admin_policy',
  '$t:public_policy',
])

export function isProtectedRole(role: Pick<DirectusRolePayload, 'name'>): boolean {
  return PROTECTED_ROLE_NAMES.has(role.name)
}

export function isProtectedPolicy(policy: Pick<DirectusPolicyPayload, 'name' | 'admin_access'>): boolean {
  if (policy.admin_access === true)
    return true
  return PROTECTED_POLICY_NAMES.has(policy.name)
}
