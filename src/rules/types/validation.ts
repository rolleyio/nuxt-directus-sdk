/**
 * Validation types for Standard Schema integration and Directus validation format
 */

/**
 * Standard Schema V1 interface
 * @see https://github.com/standard-schema/standard-schema
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaProps<Input, Output>
}

export interface StandardSchemaProps<Input = unknown, Output = Input> {
  readonly version: 1
  readonly vendor: string
  readonly validate: (
    value: unknown,
  ) => StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>
  readonly types?: {
    readonly input: Input
    readonly output: Output
  }
}

export interface StandardSchemaResult<Output> {
  readonly value?: Output
  readonly issues?: readonly StandardSchemaIssue[]
}

export interface StandardSchemaIssue {
  readonly message: string
  readonly path?: readonly (string | number | symbol)[]
}

/**
 * Type guard to check if a value is a Standard Schema
 */
export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  if (!('~standard' in value)) {
    return false
  }

  const standard = (value as StandardSchemaV1)['~standard'] // eslint-disable-line typescript/no-unsafe-type-assertion -- type guard: checked 'in' above

  if (typeof standard !== 'object' || standard === null) {
    return false
  }

  return standard.version === 1
}

/**
 * Directus validation format - what gets sent to the API
 * Used in the `validation` field of permissions
 */
export interface DirectusValidation {
  _and?: DirectusValidationRule[]
  _or?: DirectusValidationRule[]
  [field: string]: DirectusFieldValidation | DirectusValidationRule[] | undefined
}

/**
 * A single validation rule (can be field-level or logical group)
 */
export type DirectusValidationRule =
  | DirectusValidation
  | { [field: string]: DirectusFieldValidation }

/**
 * Field-level validation operators
 */
export interface DirectusFieldValidation {
  /** Regex pattern the value must match */
  _regex?: string
  /** Value must equal this */
  _eq?: unknown
  /** Value must not equal this */
  _neq?: unknown
  /** Value must be one of these */
  _in?: unknown[]
  /** Value must not be one of these */
  _nin?: unknown[]
  /** Value must be null */
  _null?: boolean
  /** Value must not be null */
  _nnull?: boolean
  /** Value must be greater than */
  _gt?: number | string
  /** Value must be greater than or equal */
  _gte?: number | string
  /** Value must be less than */
  _lt?: number | string
  /** Value must be less than or equal */
  _lte?: number | string
  /** Field must be submitted (present in payload) */
  _submitted?: boolean
}
