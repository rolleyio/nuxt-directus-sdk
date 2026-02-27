/**
 * Testing exports for the Directus Rules DSL
 */

// Filter evaluator
export { evaluateFilter } from './evaluator'

// Field checker
export { canAccessField, getAccessibleFields, getPresets } from './field-checker'

// Vitest matchers
export { createRulesMatchers } from './matchers'

export type { MatcherResult, RulesMatcherExtensions } from './matchers'

// Main tester
export { createRulesTester } from './tester'

export type {
  PermissionTestResult,
  RulesTester,
  ValidationIssue,
  ValidationTestResult,
} from './tester'
