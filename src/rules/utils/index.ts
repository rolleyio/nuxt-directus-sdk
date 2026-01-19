/**
 * Utility exports for the Directus Rules DSL
 */

export type { NormalizedRole, NormalizedRules } from './serialize'
export { normalizeRules, serializeToDirectusApi, serializeToJson } from './serialize'

export {
  addPolicyToRole,
  createAdminPolicy,
  createAdminPolicyConfig,
  createPolicy,
  extendRules,
  mergeRules,
  policyPermissionsToObject,
} from './merge'
