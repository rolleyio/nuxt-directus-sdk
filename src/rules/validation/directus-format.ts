/**
 * Helpers for defining validation rules in Directus format
 */

import type { DirectusFieldValidation, DirectusValidation } from '../types'

/**
 * Create a validation rule in Directus format
 *
 * Use this when you need to define validation rules directly in Directus format,
 * bypassing Standard Schema conversion.
 *
 * @example
 * ```typescript
 * .create({
 *   validation: directusValidation({
 *     title: { _nnull: true, _regex: '^.{5,200}$' },
 *     status: { _in: ['draft', 'published'] }
 *   })
 * })
 * ```
 */
export function directusValidation(
  validation: DirectusValidation,
): DirectusValidation {
  return validation
}

/**
 * Create a field-level validation rule
 *
 * @example
 * ```typescript
 * validation: allOf(
 *   field('title', { _nnull: true }),
 *   field('title', { _regex: '^.{5,200}$' })
 * )
 * ```
 */
export function field(
  fieldName: string,
  rules: DirectusFieldValidation,
): DirectusValidation {
  return { [fieldName]: rules }
}

/**
 * Combine multiple validations with AND logic
 * All rules must pass
 *
 * @example
 * ```typescript
 * validation: allOf(
 *   field('title', { _nnull: true }),
 *   field('content', { _nnull: true })
 * )
 * ```
 */
export function allOf(...validations: DirectusValidation[]): DirectusValidation {
  return { _and: validations }
}

/**
 * Combine validations with OR logic
 * At least one rule must pass
 *
 * @example
 * ```typescript
 * validation: oneOf(
 *   field('email', { _nnull: true }),
 *   field('phone', { _nnull: true })
 * )
 * ```
 */
export function oneOf(...validations: DirectusValidation[]): DirectusValidation {
  return { _or: validations }
}

/**
 * Create a required field rule (not null)
 */
export function required(fieldName: string): DirectusValidation {
  return { [fieldName]: { _nnull: true } }
}

/**
 * Create a regex pattern rule
 */
export function pattern(fieldName: string, regex: string | RegExp): DirectusValidation {
  const regexStr = regex instanceof RegExp ? regex.source : regex
  return { [fieldName]: { _regex: regexStr } }
}

/**
 * Create a min/max length rule using regex
 */
export function length(
  fieldName: string,
  options: { min?: number, max?: number },
): DirectusValidation {
  const min = options.min ?? 0
  const max = options.max ?? ''
  const regex = `^.{${min},${max}}$`
  return { [fieldName]: { _regex: regex } }
}

/**
 * Create an enum/allowed values rule
 */
export function oneOfValues(fieldName: string, values: unknown[]): DirectusValidation {
  return { [fieldName]: { _in: values } }
}
