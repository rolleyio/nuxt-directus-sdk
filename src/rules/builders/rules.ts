/**
 * defineDirectusRules - Main entry point for the Rules DSL
 */

import type { RulesConfig, RulesInput } from '../types'
import { parseRulesInput } from './parser'

/**
 * Define Directus permission rules using a plain object
 *
 * @example
 * ```typescript
 * import { defineDirectusRules } from 'nuxt-directus-sdk/rules'
 *
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
 *               update: {
 *                 fields: ['title', 'content'],
 *                 filter: { author: { _eq: '$CURRENT_USER' } }
 *               },
 *               delete: { filter: { status: { _eq: 'draft' } } }
 *             },
 *             categories: { read: true }
 *           }
 *         }
 *       ]
 *     },
 *     {
 *       name: 'Admin',
 *       policies: [
 *         {
 *           name: 'Full Access',
 *           adminAccess: true
 *         }
 *       ]
 *     }
 *   ]
 * })
 * ```
 *
 * Permission shorthand values:
 * - `true` - Allow full access to all fields
 * - `false` - Deny access
 * - `'*'` - Allow access to all fields (equivalent to `{ fields: '*' }`)
 * - `{ fields, filter, presets, validation }` - Detailed configuration
 */
export function defineDirectusRules<Schema>(input: RulesInput<Schema>): RulesConfig<Schema> {
  return parseRulesInput<Schema>(input)
}
