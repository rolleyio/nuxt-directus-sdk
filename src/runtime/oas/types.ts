export interface GenerateTypeOptions {
  url: string
  token: string
  collections?: string[]
}

export type SchemaPropertyType = 'string' | 'integer' | 'boolean' | 'array'

export interface SchemaPropertyOneOfReference {
  $ref: string
}

export type SchemaPropertyOneOfValue = SchemaPropertyOneOfReference | SchemaPropertySingle[]
export interface SchemaPropertyOneOf {
  nullable: boolean
  oneOf: SchemaPropertyOneOfValue[]
}

export interface SchemaPropertySingle {
  nullable: boolean
  type?: SchemaPropertyType
  format?: string
  items?: SchemaPropertyOneOf
}

export type SchemaProperty = SchemaPropertySingle | SchemaPropertyOneOf

export interface Schema {
  type: string
  'x-collection'?: string
  properties: Record<string, SchemaProperty>
}

export type SchemasRecord = Record<string, Schema>
