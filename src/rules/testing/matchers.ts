/**
 * Custom Vitest matchers for testing Directus rules
 */

import type { PermissionAction } from '../types'
import type { RulesTester } from './tester'

/**
 * Result type for custom matchers
 */
export interface MatcherResult {
  pass: boolean
  message: () => string
}

/**
 * Create custom Vitest matchers for a rules tester
 *
 * @example
 * ```typescript
 * import { expect } from 'vitest'
 * import { createRulesTester, createRulesMatchers } from 'nuxt-directus-sdk/rules'
 *
 * const tester = createRulesTester(rules)
 * const matchers = createRulesMatchers(tester)
 *
 * expect.extend(matchers)
 *
 * // Now you can use:
 * expect('Editor').toAllowAction('read', 'posts')
 * expect('Editor').toRestrictAction('delete', 'users')
 * expect('Editor').toAllowFields('update', 'posts', ['title', 'content'])
 * ```
 */
export function createRulesMatchers<Schema>(tester: RulesTester<Schema>) {
  return {
    /**
     * Assert that a role/policy allows an action on a collection
     */
    toAllowAction(
      received: string,
      action: PermissionAction,
      collection: keyof Schema,
    ): MatcherResult {
      const result = tester.can(received, action, collection)

      return {
        pass: result.allowed,
        message: () =>
          result.allowed
            ? `Expected "${received}" NOT to allow ${action} on ${String(collection)}`
            : `Expected "${received}" to allow ${action} on ${String(collection)}. ${result.reason}`,
      }
    },

    /**
     * Assert that a role/policy restricts an action on a collection
     */
    toRestrictAction(
      received: string,
      action: PermissionAction,
      collection: keyof Schema,
    ): MatcherResult {
      const result = tester.can(received, action, collection)

      return {
        pass: !result.allowed,
        message: () =>
          !result.allowed
            ? `Expected "${received}" NOT to restrict ${action} on ${String(collection)}`
            : `Expected "${received}" to restrict ${action} on ${String(collection)}`,
      }
    },

    /**
     * Assert that a role/policy allows access to specific fields
     */
    toAllowFields(
      received: string,
      action: PermissionAction,
      collection: keyof Schema,
      expectedFields: string[],
    ): MatcherResult {
      const accessibleFields = tester.getAccessibleFields(received, action, collection)

      if (accessibleFields === '*') {
        return {
          pass: true,
          message: () =>
            `Expected "${received}" NOT to allow all fields for ${action} on ${String(collection)}`,
        }
      }

      const fieldStrings = accessibleFields.map(String)
      const missingFields = expectedFields.filter((f) => !fieldStrings.includes(f))

      return {
        pass: missingFields.length === 0,
        message: () =>
          missingFields.length === 0
            ? `Expected "${received}" NOT to allow fields [${expectedFields.join(', ')}] for ${action} on ${String(collection)}`
            : `Expected "${received}" to allow fields [${missingFields.join(', ')}] for ${action} on ${String(collection)}. Accessible fields: [${fieldStrings.join(', ')}]`,
      }
    },

    /**
     * Assert that a role/policy restricts access to specific fields
     */
    toRestrictFields(
      received: string,
      action: PermissionAction,
      collection: keyof Schema,
      restrictedFields: string[],
    ): MatcherResult {
      const accessibleFields = tester.getAccessibleFields(received, action, collection)

      if (accessibleFields === '*') {
        return {
          pass: false,
          message: () =>
            `Expected "${received}" to restrict fields [${restrictedFields.join(', ')}] but it allows all fields for ${action} on ${String(collection)}`,
        }
      }

      const fieldStrings = accessibleFields.map(String)
      const unexpectedlyAllowed = restrictedFields.filter((f) => fieldStrings.includes(f))

      return {
        pass: unexpectedlyAllowed.length === 0,
        message: () =>
          unexpectedlyAllowed.length === 0
            ? `Expected "${received}" NOT to restrict fields [${restrictedFields.join(', ')}] for ${action} on ${String(collection)}`
            : `Expected "${received}" to restrict fields [${unexpectedlyAllowed.join(', ')}] for ${action} on ${String(collection)}, but they are accessible`,
      }
    },

    /**
     * Assert that a role/policy has admin access
     */
    toHaveAdminAccess(received: string): MatcherResult {
      const rules = tester.getRules()

      // Check roles
      const role = rules.roles.find((r) => r.name === received)
      if (role) {
        const hasAdmin = role.policies.some((p) => p.adminAccess)
        return {
          pass: hasAdmin,
          message: () =>
            hasAdmin
              ? `Expected role "${received}" NOT to have admin access`
              : `Expected role "${received}" to have admin access`,
        }
      }

      // Check policies
      const policy =
        rules.policies.find((p) => p.name === received) ||
        rules.roles.flatMap((r) => r.policies).find((p) => p.name === received)

      if (policy) {
        return {
          pass: policy.adminAccess ?? false,
          message: () =>
            policy.adminAccess
              ? `Expected policy "${received}" NOT to have admin access`
              : `Expected policy "${received}" to have admin access`,
        }
      }

      return {
        pass: false,
        message: () => `Role or policy "${received}" not found`,
      }
    },
  }
}

/**
 * Type declarations for custom matchers
 * Add this to your test setup file or vitest.d.ts
 *
 * @example
 * ```typescript
 * // vitest.d.ts
 * import 'vitest'
 * import type { RulesMatcherExtensions } from 'nuxt-directus-sdk/rules'
 *
 * declare module 'vitest' {
 *   interface Assertion<T> extends RulesMatcherExtensions<T> {}
 *   interface AsymmetricMatchersContaining extends RulesMatcherExtensions<unknown> {}
 * }
 * ```
 */
export interface RulesMatcherExtensions<T> {
  toAllowAction: (action: PermissionAction, collection: string) => T
  toRestrictAction: (action: PermissionAction, collection: string) => T
  toAllowFields: (action: PermissionAction, collection: string, fields: string[]) => T
  toRestrictFields: (action: PermissionAction, collection: string, fields: string[]) => T
  toHaveAdminAccess: () => T
}
