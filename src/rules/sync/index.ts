/**
 * Sync module for comparing and syncing rules with Directus
 */

export type { CompareOptions } from './diff'

export { compareRulesPayloads, diffRemoteRules, diffRules, fetchRemoteRules, fetchRemoteRulesAsJson, pullRules } from './diff'
export { formatDiff } from './format'
export { formatPushResult, pushRules } from './push'
export type {
  ChangeType,
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
} from './types'
