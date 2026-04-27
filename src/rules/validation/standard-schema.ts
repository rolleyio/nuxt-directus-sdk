/**
 * Standard Schema to Directus validation converter
 *
 * Standard Schema is a common interface implemented by validation libraries
 * like Zod, ArkType, and Valibot. This module detects the vendor and converts
 * schemas to Directus validation format where possible.
 *
 * @see https://github.com/standard-schema/standard-schema
 */

import { type DirectusFieldValidation, type DirectusValidation, isStandardSchema, type StandardSchemaV1 } from '../types'

/**
 * Convert a Standard Schema to Directus validation format
 *
 * This function detects the schema vendor and attempts to convert it.
 * For complex schemas that can't be converted, use `directusValidation()` instead.
 *
 * @example
 * ```typescript
 * import { type } from 'arktype'
 *
 * const schema = type({ title: 'string >= 5' })
 * const validation = toDirectusValidation(schema)
 * // { title: { _regex: '^.{5,}$' } }
 * ```
 */
export function toDirectusValidation<T>(
  schema: StandardSchemaV1<T, T>,
): DirectusValidation {
  const vendor = schema['~standard'].vendor

  switch (vendor) {
    case 'arktype':
      return convertArkTypeSchema(schema)
    case 'zod':
      return convertZodSchema(schema)
    case 'valibot':
      return convertValibotSchema(schema)
    default:
      throw new Error(
        `Cannot auto-convert schema from vendor "${vendor}". `
        + `Use directusValidation() helper to define validation in Directus format directly.`,
      )
  }
}

/**
 * Check if a validation value is a Standard Schema
 */
export function isValidationStandardSchema(
  validation: unknown,
): validation is StandardSchemaV1 {
  return isStandardSchema(validation)
}

/**
 * Convert ArkType schema to Directus validation
 *
 * ArkType uses a string-based DSL that we can parse for common patterns.
 * Complex schemas may not be fully convertible.
 */
function convertArkTypeSchema(schema: StandardSchemaV1): DirectusValidation {
  // ArkType stores definition in various internal properties (.t, .json, .expression)
  // with no public type interface — we must introspect them at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schemaAny = schema as any

  // Check for object type with properties
  if (schemaAny.t?.domain === 'object' || schemaAny.json?.domain === 'object') {
    const props = schemaAny.t?.props || schemaAny.json?.props || {}
    return convertObjectProps(props, 'arktype')
  }

  // For simple schemas, try to extract from the internal representation
  if (schemaAny.expression || schemaAny.t?.expression) {
    const expr = schemaAny.expression || schemaAny.t?.expression
    return convertExpressionToValidation(expr)
  }

  // Fallback: return empty validation (all values pass)
  console.warn(
    'Could not fully convert ArkType schema to Directus validation. '
    + 'Consider using directusValidation() for complex schemas.',
  )
  return {}
}

/**
 * Convert Zod schema to Directus validation
 *
 * Zod stores schema definition in _def property.
 */
function convertZodSchema(schema: StandardSchemaV1): DirectusValidation {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schemaAny = schema as any
  const def = schemaAny._def

  if (!def) {
    console.warn('Could not access Zod schema definition.')
    return {}
  }

  // Handle ZodObject
  if (def.typeName === 'ZodObject' && def.shape) {
    const validation: DirectusValidation = {}

    for (const [field, fieldSchema] of Object.entries(def.shape())) {
      const fieldValidation = convertZodFieldSchema(fieldSchema)
      if (fieldValidation && Object.keys(fieldValidation).length > 0) {
        validation[field] = fieldValidation
      }
    }

    return validation
  }

  // Handle single field schema
  const fieldValidation = convertZodFieldSchema(schemaAny)
  if (fieldValidation) {
    return fieldValidation as DirectusValidation
  }

  return {}
}

/**
 * Convert a single Zod field schema to Directus field validation
 */
// Receives Zod internal schema objects whose shape is not publicly typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertZodFieldSchema(schema: any): Record<string, unknown> | null {
  if (!schema?._def)
    return null

  const def = schema._def
  const validation: Record<string, unknown> = {}

  // Walk through the schema chain (Zod uses wrapping for modifiers)
  let current = def
  while (current) {
    switch (current.typeName) {
      case 'ZodString':
        // Check for string constraints
        if (current.checks) {
          for (const check of current.checks) {
            if (check.kind === 'min') {
              validation._regex = validation._regex
                ? combineRegex(validation._regex as string, `^.{${check.value},}`)
                : `^.{${check.value},}`
            }
            if (check.kind === 'max') {
              validation._regex = validation._regex
                ? combineRegex(validation._regex as string, `^.{0,${check.value}}$`)
                : `^.{0,${check.value}}$`
            }
            if (check.kind === 'regex') {
              validation._regex = check.regex.source
            }
            if (check.kind === 'email') {
              validation._regex = '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
            }
          }
        }
        break

      case 'ZodNumber':
        if (current.checks) {
          for (const check of current.checks) {
            if (check.kind === 'min') {
              validation[check.inclusive ? '_gte' : '_gt'] = check.value
            }
            if (check.kind === 'max') {
              validation[check.inclusive ? '_lte' : '_lt'] = check.value
            }
          }
        }
        break

      case 'ZodEnum':
        validation._in = current.values
        break

      case 'ZodNullable':
      case 'ZodOptional':
        // These don't add constraints
        current = current.innerType?._def
        continue

      case 'ZodDefault':
        current = current.innerType?._def
        continue
    }

    // Move to inner type if exists
    current = current.innerType?._def
  }

  // If schema is not optional/nullable, field is required
  if (!schema.isOptional?.() && !schema.isNullable?.()) {
    validation._nnull = true
  }

  return Object.keys(validation).length > 0 ? validation : null
}

/**
 * Convert Valibot schema to Directus validation
 */
function convertValibotSchema(schema: StandardSchemaV1): DirectusValidation {
  // Valibot v1+ uses internal .type and .entries properties with no public
  // type interface — we must introspect them at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schemaAny = schema as any

  // Check for object schema with entries
  if (schemaAny.type === 'object' && schemaAny.entries) {
    const validation: DirectusValidation = {}

    for (const [field, fieldSchema] of Object.entries(schemaAny.entries)) {
      const fieldValidation = convertValibotFieldSchema(fieldSchema)
      if (fieldValidation && Object.keys(fieldValidation).length > 0) {
        validation[field] = fieldValidation
      }
    }

    return validation
  }

  console.warn(
    'Could not fully convert Valibot schema to Directus validation. '
    + 'Consider using directusValidation() for complex schemas.',
  )
  return {}
}

/**
 * Convert a single Valibot field schema to Directus field validation
 */
// Receives Valibot internal schema objects whose shape is not publicly typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertValibotFieldSchema(schema: any): Record<string, unknown> | null {
  if (!schema)
    return null

  const validation: Record<string, unknown> = {}

  // Check schema type
  if (schema.type === 'string') {
    // Check for pipe transformations/validations
    if (schema.pipe) {
      for (const action of schema.pipe) {
        if (action.type === 'min_length') {
          validation._regex = `^.{${action.requirement},}$`
        }
        if (action.type === 'max_length') {
          validation._regex = validation._regex
            ? combineRegex(validation._regex as string, `^.{0,${action.requirement}}$`)
            : `^.{0,${action.requirement}}$`
        }
        if (action.type === 'regex') {
          validation._regex = action.requirement.source
        }
        if (action.type === 'email') {
          validation._regex = '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
        }
      }
    }
    validation._nnull = true
  }

  if (schema.type === 'number') {
    if (schema.pipe) {
      for (const action of schema.pipe) {
        if (action.type === 'min_value') {
          validation._gte = action.requirement
        }
        if (action.type === 'max_value') {
          validation._lte = action.requirement
        }
      }
    }
    validation._nnull = true
  }

  if (schema.type === 'enum' || schema.type === 'picklist') {
    validation._in = schema.options || schema.enum
    validation._nnull = true
  }

  if (schema.type === 'optional' || schema.type === 'nullable') {
    const innerValidation = convertValibotFieldSchema(schema.wrapped)
    if (innerValidation) {
      delete innerValidation._nnull
      return innerValidation
    }
    return null
  }

  return Object.keys(validation).length > 0 ? validation : null
}

/**
 * Convert object properties to validation (generic helper)
 */
function convertObjectProps(
  // Receives ArkType internal prop objects whose shape is not publicly typed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>,
  _vendor: string,
): DirectusValidation {
  const validation: DirectusValidation = {}

  for (const [field, prop] of Object.entries(props)) {
    const fieldValidation = convertPropToValidation(prop)
    if (fieldValidation && Object.keys(fieldValidation).length > 0) {
      validation[field] = fieldValidation
    }
  }

  return validation
}

/**
 * Convert a property constraint to validation
 */
// Receives ArkType internal prop objects whose shape is not publicly typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertPropToValidation(prop: any): Record<string, unknown> | null {
  if (!prop)
    return null

  const validation: Record<string, unknown> = {}

  // Check for common constraint types
  if (prop.kind === 'string' || prop.domain === 'string') {
    validation._nnull = true
    if (prop.minLength !== undefined) {
      validation._regex = `^.{${prop.minLength},}$`
    }
    if (prop.maxLength !== undefined) {
      validation._regex = validation._regex
        ? combineRegex(validation._regex as string, `^.{0,${prop.maxLength}}$`)
        : `^.{0,${prop.maxLength}}$`
    }
    if (prop.pattern) {
      validation._regex = prop.pattern
    }
  }

  if (prop.kind === 'number' || prop.domain === 'number') {
    validation._nnull = true
    if (prop.min !== undefined)
      validation._gte = prop.min
    if (prop.max !== undefined)
      validation._lte = prop.max
  }

  if (prop.kind === 'enum' || prop.values) {
    validation._in = prop.values || prop.enum
    validation._nnull = true
  }

  return Object.keys(validation).length > 0 ? validation : null
}

/**
 * Convert an expression string to validation
 */
function convertExpressionToValidation(expr: string): DirectusValidation {
  // This is a simplified parser for common ArkType expressions
  // Format: "string >= 5 & string <= 200" or "'draft' | 'published'"

  // Build field-level operators; cast to DirectusValidation on return since the
  // result is used as a record-level filter object by the caller.
  const validation: DirectusFieldValidation = {}

  // Check for string length constraints
  const minMatch = expr.match(/string\s*>=?\s*(\d+)/)
  const maxMatch = expr.match(/string\s*<=?\s*(\d+)/)

  if (minMatch || maxMatch) {
    const min = minMatch ? minMatch[1] : '0'
    const max = maxMatch ? maxMatch[1] : ''
    validation._regex = `^.{${min},${max}}$`
  }

  // Check for enum/union of literals
  const literalMatch = expr.match(/'([^']+)'/g)
  if (literalMatch) {
    validation._in = literalMatch.map(l => l.replace(/'/g, ''))
  }

  return validation as DirectusValidation
}

/**
 * Combine two regex patterns into one that matches both
 */
function combineRegex(regex1: string, regex2: string): string {
  // Extract the length constraints and combine them
  const match1 = regex1.match(/\^\.\{(\d*),(\d*)\}\$?/)
  const match2 = regex2.match(/\^\.\{(\d*),(\d*)\}\$?/)

  if (match1 && match2) {
    const min1 = match1[1] ? Number.parseInt(match1[1]) : 0
    const max1 = match1[2] ? Number.parseInt(match1[2]) : Number.POSITIVE_INFINITY
    const min2 = match2[1] ? Number.parseInt(match2[1]) : 0
    const max2 = match2[2] ? Number.parseInt(match2[2]) : Number.POSITIVE_INFINITY

    const min = Math.max(min1, min2)
    const max = Math.min(max1, max2)

    if (max === Number.POSITIVE_INFINITY) {
      return `^.{${min},}$`
    }
    return `^.{${min},${max}}$`
  }

  // If we can't combine them, just return the first one
  return regex1
}
