import type { SnapshotCollection, SnapshotField, SnapshotRelation } from '@directus/types'
import type { TypegenExtension } from './extensions'
import { createDirectus, isDirectusError, readCollections, readFields, readRelations, rest, staticToken } from '@directus/sdk'
import { typegenExtensions } from './extensions'

export const FALLBACK_TYPE_STRING = 'declare global {\n\ninterface DirectusFile {\n\tid: string;\n}\ninterface DirectusUser {\n\tid: string;\n}\ninterface DirectusSchema { }\n}\n\nexport {};'

/** Augmented SnapshotField shape used inside determineFieldType — adds optional relation metadata */
interface FieldWithRelation extends SnapshotField {
  relation?: {
    collection: string
    type?: string
    allowedCollections?: string[]
  }
}

interface RewriteRecord {
  fromCollection: string
  fromField: string
  target: string
}

type RelationMap = Map<string, CollectionRelations>

interface CollectionRelations {
  m2o: Map<string, RelatedField> // field → related collection
  o2m: Map<string, RelatedField> // virtual field → related collection
  m2a: Map<string, string[]> // field → allowed collections
}

interface RelatedField {
  relatedCollection: string
}

interface InterfaceField {
  fieldName: string
  typeString: string
  isOptional: boolean
  snapshotField: SnapshotField
  sortOrder: number
}

/**
 * Fetches collections, fields, and relations from a live Directus instance and
 * generates a TypeScript declaration string.
 *
 * @param url - Base URL of the Directus instance.
 * @param token - Static access token for authentication.
 * @param prefix - Prefix used when generating interface names.
 * @returns The generated TypeScript string and an array of log messages.
 */
export interface GenerateTypesOptions {
  /**
   * Collection names to include. When non-empty, only these collections
   * (plus any collections they reference — see `expandReferences`) are
   * emitted. References to collections not in the resolved set collapse
   * to `string` / `string[]`.
   */
  include?: string[]
  /**
   * When `include` is set, also pull in any collections referenced by
   * the included collections (transitively). Follows M2O, O2M, M2A, and
   * translations relations. No-op when `include` is empty.
   * @default true
   */
  expandReferences?: boolean
  /**
   * Collection names to exclude from the generated types. References to
   * excluded collections are rewritten to `string` (M2O), `string[]` (O2M),
   * or a filtered union (M2A).
   *
   * When both `include` and `exclude` are set, `include` wins and `exclude`
   * is ignored with a warning.
   */
  exclude?: string[]
  /**
   * When true, emit per-reference warnings for every field whose target
   * collection was collapsed to `string` / `string[]`. Grouped by target
   * collection to keep the output readable.
   * @default false
   */
  verbose?: boolean
}

export async function generateTypesFromDirectus(
  url: string,
  token: string,
  prefix: string,
  options: GenerateTypesOptions = {},
): Promise<{ typeString: string, logs: string[] }> {
  const logs: string[] = []
  const client = createDirectus(url).with(rest()).with(staticToken(token))

  let result: [SnapshotCollection[], SnapshotField[], SnapshotRelation[]] | null = null

  try {
    const [collections, fields, relations] = await Promise.all([
      client.request(readCollections()),
      client.request(readFields()),
      client.request(readRelations()),
    ])
    logs.push(`  - Fetched ${collections.length} collections, ${fields.length} fields, ${relations.length} relations`)

    if (collections.length === 0 || fields.length === 0 || relations.length === 0) {
      throw new Error(`Empty response from Directus — collections: ${collections.length}, fields: ${fields.length}, relations: ${relations.length}`)
    }

    result = [
      collections as unknown as SnapshotCollection[],
      fields as unknown as SnapshotField[],
      relations as unknown as SnapshotRelation[],
    ]
  }
  catch (error) {
    if (isDirectusError(error)) {
      logs.push(`  - Directus error ${error.errors.map(e => `[${e.extensions?.code}] ${e.message}`).join(', ')}`)
    }
    else {
      logs.push(`  - Error: ${error instanceof Error ? error.message : String(error)}`)
    }
    return { typeString: FALLBACK_TYPE_STRING, logs }
  }

  // Validate option interaction: include wins, with a warning if exclude was
  // also set. This is almost certainly user confusion rather than intent.
  const resolvedOptions: { include: string[], exclude: string[], verbose: boolean } = {
    include: options.include ?? [],
    exclude: options.exclude ?? [],
    verbose: options.verbose ?? false,
  }
  if (resolvedOptions.include.length > 0 && resolvedOptions.exclude.length > 0) {
    logs.push('  - Warning: both include and exclude were set; exclude is ignored because include takes precedence')
    resolvedOptions.exclude = []
  }

  // When `expandReferences` is on (default) and `include` is set, walk the
  // relation graph from the user's include list and pull in every referenced
  // collection transitively. Follows M2O, O2M, and M2A. Users typically want
  // this — including `posts` without expansion would strip the type from
  // `posts.author` even though `directus_users` is almost certainly needed.
  // expandReferences only applies when `include` is set. No warning when
  // `include` is empty — it's just a no-op and logging about it is noise.
  const expandReferences = options.expandReferences ?? true
  if (expandReferences && resolvedOptions.include.length > 0) {
    const originalSize = resolvedOptions.include.length
    const expanded = expandIncludeViaReferences(resolvedOptions.include, result[2])
    if (expanded.size > originalSize) {
      resolvedOptions.include = Array.from(expanded)
      const added = expanded.size - originalSize
      logs.push(`  - Expanded include from ${originalSize} → ${expanded.size} collection${expanded.size === 1 ? '' : 's'} (+${added} via references)`)
    }
  }

  const { typeString, rewrites, emittedCount } = transformSnapshotToTypeString(...result, prefix, undefined, resolvedOptions)

  // If an include/exclude filter is active, report what made it through. We
  // don't log this when no filter is set — folder-type collections (with
  // `schema: null`) are always dropped and would otherwise create a
  // confusing "N filtered out" line on every run.
  const filterActive = resolvedOptions.include.length > 0 || resolvedOptions.exclude.length > 0
  if (filterActive) {
    const fetchedCount = result[0].length
    const filteredOut = fetchedCount - emittedCount
    logs.push(`  - Emitting ${emittedCount} collection${emittedCount === 1 ? '' : 's'} (${filteredOut} filtered out)`)
  }

  // Summarise reference rewrites so users can see what collapsed to `string`.
  // In verbose mode, emit grouped per-target warnings (field names shown,
  // capped at 5 per collection to avoid flooding). Otherwise a single
  // summary line.
  if (rewrites.length > 0) {
    const totalFields = rewrites.length
    const byTarget = new Map<string, RewriteRecord[]>()
    for (const rec of rewrites) {
      const list = byTarget.get(rec.target) ?? []
      list.push(rec)
      byTarget.set(rec.target, list)
    }
    const reason = resolvedOptions.include.length > 0 ? 'not in include list' : 'excluded'
    logs.push(`  - ${totalFields} field reference${totalFields === 1 ? '' : 's'} across ${byTarget.size} target${byTarget.size === 1 ? '' : 's'} collapsed to string (${reason})`)

    if (resolvedOptions.verbose) {
      for (const [target, recs] of byTarget) {
        const collectionCount = new Set(recs.map(r => r.fromCollection)).size
        logs.push(`    · ${target} (${reason}) — referenced by ${recs.length} field${recs.length === 1 ? '' : 's'} across ${collectionCount} collection${collectionCount === 1 ? '' : 's'}`)
        const preview = recs.slice(0, 5).map(r => `${r.fromCollection}.${r.fromField}`)
        const suffix = recs.length > 5 ? `, …and ${recs.length - 5} more` : ''
        logs.push(`      ${preview.join(', ')}${suffix}`)
      }
    }
  }

  return { typeString, logs }
}

/**
 * Transforms Directus collections, fields, and relations into a TypeScript declaration string.
 *
 * - Builds a relation map from relations.
 * - Separates custom and system collections and infers missing system ones.
 * - Tracks singleton collections.
 * - Generates collection interfaces and deduplicated extension outputs.
 * - Generates `DirectusSchema` and `CollectionNames` enum.
 * - Wraps everything in a `declare global` block.
 *
 * @param collections - Collection definitions from the Directus snapshot.
 * @param fields - Field definitions from the Directus snapshot.
 * @param relations - Relation definitions from the Directus snapshot.
 * @param prefix - Prefix used for generating interface names.
 * @param extensions - Optional type generation extensions.
 * @returns A TypeScript declaration file as a string.
 */
export function transformSnapshotToTypeString(
  collections: SnapshotCollection[],
  fields: SnapshotField[],
  relations: SnapshotRelation[],
  prefix: string,
  extensions: TypegenExtension[] = typegenExtensions,
  filter: { include?: string[], exclude?: string[] } = {},
): { typeString: string, rewrites: RewriteRecord[], emittedCount: number } {
  // Resolve the allow-list once. When `include` is non-empty the allow-list
  // is that set; otherwise it's every known collection minus `exclude`.
  const includeList = filter.include ?? []
  const excludeList = filter.exclude ?? []
  const useInclude = includeList.length > 0
  const includeSet = new Set(includeList)
  const excludeSet = new Set(excludeList)

  const isCollectionAllowed = (name: string): boolean => {
    if (useInclude)
      return includeSet.has(name)
    return !excludeSet.has(name)
  }

  // The set of "missing" collection names — those a field might reference
  // that won't be emitted. We collect rewrite records for reporting.
  const rewrites: RewriteRecord[] = []

  const relationMap = buildRelationMapFromSnapshot(relations)

  const collectionsWithDatabaseTables = collections.filter(
    c => c.schema !== null && isCollectionAllowed(c.collection),
  )

  const customCollections = collectionsWithDatabaseTables.filter(
    c => !collectionIsDirectusSystem(c.collection),
  )

  // System collections present in the snapshot, identified by the directus_ naming convention
  const systemCollectionsFromSnapshot = collectionsWithDatabaseTables.filter(
    c => collectionIsDirectusSystem(c.collection),
  )

  // System collections referenced in relations but absent from collections
  const systemCollectionNamesAlreadyPresent = new Set(
    systemCollectionsFromSnapshot.map(c => c.collection),
  )
  const impliedSystemCollections = [
    ...new Set(
      relations
        .flatMap(r => [r.collection, r.related_collection ?? ''])
        .filter(
          name =>
            collectionIsDirectusSystem(name)
            && !systemCollectionNamesAlreadyPresent.has(name)
            && isCollectionAllowed(name),
        ),
    ),
  ].map(name => ({ collection: name, schema: { name }, meta: null as null }))
  const allCollectionsForSchema = [
    ...collectionsWithDatabaseTables,
    ...impliedSystemCollections,
  ]

  // "Missing" = any collection that another collection's field references
  // but which we're not emitting. We track these for reference rewriting
  // and for the user-facing summary.
  const allCollectionNamesInSchema = new Set(allCollectionsForSchema.map(c => c.collection))
  const isMissing = (name: string): boolean => !allCollectionNamesInSchema.has(name)

  const singletonCollectionNames = new Set(
    allCollectionsForSchema
      .filter(c => c.meta?.singleton === true)
      .map(c => c.collection),
  )

  const generatedCollections = [
    ...customCollections,
    ...systemCollectionsFromSnapshot,
  ].map(collection =>
    generateInterfaceForCollection(collection, fields, relationMap, prefix, extensions, singletonCollectionNames, isMissing, rewrites),
  )

  // Deduplicate extension interface outputs by their content — an extension like seo-plugin
  // may match fields in multiple collections but its interface body should only appear once
  const seenExtensionOutputs = new Set<string>()
  const uniqueExtensionOutputs = generatedCollections
    .flatMap(g => g.extensionOutputs)
    .filter((output) => {
      if (seenExtensionOutputs.has(output))
        return false
      seenExtensionOutputs.add(output)
      return true
    })

  const customInterfaceBlocks = generatedCollections.map(g => g.interfaceBlock)

  // System collections are emitted as non-array (singular) entries in DirectusSchema so that
  // MergeCoreCollection<Schema, "directus_settings", ...> in the SDK can find the key and merge
  // any custom fields into the return types.
  // See: https://directus.io/docs/tutorials/tips-and-tricks/advanced-types-with-the-directus-sdk#custom-fields-on-core-collections
  const directusSchemaBlock = generateDirectusSchemaInterface(allCollectionsForSchema, prefix, singletonCollectionNames)

  // The enum is user-facing sugar for iterating custom collection names
  // consumers using it to build UI lists don't want `directus_activity` showing up in a dropdown.
  const allCollectionNames = allCollectionsForSchema
    .filter(c => !collectionIsDirectusSystem(c.collection))
    .map(c => c.collection)
  const enumBlock = generateCollectionNamesEnum(allCollectionNames, prefix)

  const bodyParts = [
    ...uniqueExtensionOutputs,
    ...customInterfaceBlocks,
    directusSchemaBlock,
    enumBlock,
  ]

  const typeString = [
    'declare global {',
    '',
    bodyParts.join('\n\n'),
    '}',
    '',
    'export {};',
  ].join('\n')

  // `emittedCount` reports how many collections from the Directus response
  // survived filtering (include/exclude). Implied system collections are
  // deliberately excluded from this count so it compares apples-to-apples
  // with the raw fetch count in the caller's log.
  return { typeString, rewrites, emittedCount: collectionsWithDatabaseTables.length }
}

/**
 * Determines whether a collection is a Directus system collection.
 *
 * In Directus, system collections are internally managed and are identified
 * by the `directus_` prefix in their collection name.
 *
 * @param collectionName - The name of the collection to evaluate.
 * @returns `true` if the collection name starts with `directus_`, otherwise `false`.
 */
function collectionIsDirectusSystem(collectionName: string): boolean {
  return collectionName.startsWith('directus_')
}

/**
 * Converts a Directus collection name into a TypeScript interface name.
 *
 * The transformation applies the following rules:
 *
 * - **System collections** (as determined by `collectionIsDirectusSystem`):
 *   - The `directus_` prefix is removed from the collection name.
 *   - The remaining name is singularized and converted to PascalCase.
 *   - The result is prefixed with `"Directus"`.
 *   - Example: `directus_files` → `DirectusFile`
 *
 * - **Custom collections**:
 *   - The full collection name is singularized and converted to PascalCase.
 *   - The result is prefixed with the provided `prefix`.
 *   - Example: `ai_prompts` → `{prefix}AiPrompt`
 *
 * @param collectionName - The raw collection name (e.g., `directus_files`, `ai_prompts`).
 * @param prefix - The prefix to prepend for non-system collections.
 * @returns A PascalCase interface name with the appropriate prefix applied.
 */
function collectionNameToInterfaceName(collectionName: string, prefix: string, singletons: Set<string> = new Set()): string {
  const isSingleton = singletons.has(collectionName)
  const transform = (name: string) => pascalCase(isSingleton ? name : singularize(name))

  if (collectionIsDirectusSystem(collectionName)) {
    return transform(collectionName)
  }

  return `${prefix}${transform(collectionName)}`
}

function resolveExtensionForField(
  field: SnapshotField,
  prefix: string,
  extensions: TypegenExtension[],
): { name: string, output: string } | null {
  const match = extensions.find(ext => ext.isMatch(field))
  if (!match)
    return null
  return {
    name: match.name(prefix),
    output: match.output(prefix),
  }
}

/**
 * Builds a normalized relation map from a list of Directus snapshot relations.
 *
 * This function transforms raw {@link SnapshotRelation} entries into a structured
 * {@link RelationMap} that groups relationships by collection and categorizes them
 * into:
 *
 * - **m2o (many-to-one):** Fields on a collection that reference a single item
 *   in another collection (i.e., foreign keys).
 * - **o2m (one-to-many):** Virtual fields on the "one" side that expose an array
 *   of related items from the "many" side.
 * - **m2a (many-to-any):** Polymorphic relations where a field can reference
 *   items from multiple collections.
 *
 * For each relation:
 * - If `meta.one_allowed_collections` is present, it is treated as a many-to-any relation.
 * - If `related_collection` is defined, it is treated as a many-to-one relation,
 *   and a corresponding one-to-many relation is added if `meta.one_field` exists.
 * - Relations without `meta` are ignored.
 *
 * @param relations - Array of snapshot relations as returned by the Directus schema snapshot.
 * @returns A {@link RelationMap} where each collection maps to its categorized relations.
 */
/**
 * Walk the relation graph from the user's include seeds and return the
 * transitive closure of collections that should be emitted. Follows M2O,
 * O2M, and M2A edges; cycle-safe via a visited set.
 *
 * @param seeds - Collection names the user explicitly included.
 * @param relations - All relations from the Directus snapshot.
 * @returns Set of every collection name reachable from the seeds.
 */
function expandIncludeViaReferences(seeds: string[], relations: SnapshotRelation[]): Set<string> {
  const relationMap = buildRelationMapFromSnapshot(relations)
  const visited = new Set<string>()
  const queue: string[] = [...seeds]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current))
      continue
    visited.add(current)

    const rels = relationMap.get(current)
    if (!rels)
      continue

    // Follow M2O (this collection → related collection)
    for (const { relatedCollection } of rels.m2o.values()) {
      if (!visited.has(relatedCollection))
        queue.push(relatedCollection)
    }
    // Follow O2M (virtual field here → collection holding the FK)
    for (const { relatedCollection } of rels.o2m.values()) {
      if (!visited.has(relatedCollection))
        queue.push(relatedCollection)
    }
    // Follow M2A (polymorphic — all allowed collections)
    for (const allowed of rels.m2a.values()) {
      for (const name of allowed) {
        if (!visited.has(name))
          queue.push(name)
      }
    }
  }

  return visited
}

function buildRelationMapFromSnapshot(relations: SnapshotRelation[]): RelationMap {
  const relationMap: RelationMap = new Map()

  const getOrCreateCollectionRelations = (collection: string): CollectionRelations => {
    if (!relationMap.has(collection)) {
      relationMap.set(collection, { m2o: new Map(), o2m: new Map(), m2a: new Map() })
    }
    return relationMap.get(collection)!
  }

  for (const relation of relations) {
    const { collection, field, related_collection, meta } = relation
    if (!meta)
      continue

    const isM2A = meta.one_allowed_collections && meta.one_allowed_collections.length > 0

    if (isM2A) {
      // Many-to-any: page_blocks.item can be block_hero | block_richtext | …
      getOrCreateCollectionRelations(collection).m2a.set(field, meta.one_allowed_collections!)
    }
    else if (related_collection) {
      // M2O: the "many" side holds the FK and resolves to a single related item
      getOrCreateCollectionRelations(collection).m2o.set(field, { relatedCollection: related_collection })

      // O2M: the "one" side exposes an array of related items via a virtual field
      if (meta.one_field) {
        getOrCreateCollectionRelations(related_collection).o2m.set(meta.one_field, { relatedCollection: collection })
      }
    }
  }

  return relationMap
}

interface ResolvedFieldType {
  tsType: string
  extensionOutput: string | null
}

/**
 * Resolves a TypeScript type string for a Directus snapshot field.
 *
 * - Resolves relation types (m2a, m2o, o2m).
 * - Applies extensions when matched.
 * - Falls back to `determineFieldType` for all other fields.
 *
 * @param snapshotField - Field definition from the Directus schema snapshot.
 * @param collectionRelations - Relation map for the field's collection.
 * @param prefix - Prefix used for generating interface names.
 * @param extensions - Type generation extensions.
 * @param singletons - Set of singleton collection names.
 * @returns Object containing the resolved TypeScript type and optional extension output.
 */
function resolveFieldTypeString(
  snapshotField: SnapshotField,
  collectionRelations: CollectionRelations | undefined,
  prefix: string,
  extensions: TypegenExtension[],
  singletons: Set<string> = new Set(),
  isMissing: (name: string) => boolean = () => false,
  rewrites: RewriteRecord[] = [],
): ResolvedFieldType {
  // Resolve relation info from the pre-built map using prefix-aware interface names.
  // When a related collection is "missing" (not in the emitted set — either
  // excluded or outside the include allow-list), references to it collapse
  // to the primitive-key form (`string` / `string[]`) so the emitted types
  // stay resolvable.
  if (collectionRelations?.m2a.has(snapshotField.field)) {
    const allowedCollections = collectionRelations.m2a.get(snapshotField.field)!
    const included = allowedCollections.filter(c => !isMissing(c))
    // Record the missing targets so the generator can summarise/log them.
    for (const missing of allowedCollections.filter(c => isMissing(c))) {
      rewrites.push({ fromCollection: snapshotField.collection, fromField: snapshotField.field, target: missing })
    }
    if (included.length === 0) {
      return { tsType: 'string', extensionOutput: null }
    }
    const unionTypes = included
      .map(c => collectionNameToInterfaceName(c, prefix, singletons))
      .join(' | ')
    return { tsType: `${unionTypes} | string`, extensionOutput: null }
  }

  if (collectionRelations?.m2o.has(snapshotField.field)) {
    const related = collectionRelations.m2o.get(snapshotField.field)!
    if (isMissing(related.relatedCollection)) {
      rewrites.push({ fromCollection: snapshotField.collection, fromField: snapshotField.field, target: related.relatedCollection })
      return { tsType: 'string', extensionOutput: null }
    }
    return { tsType: `${collectionNameToInterfaceName(related.relatedCollection, prefix, singletons)} | string`, extensionOutput: null }
  }

  if (collectionRelations?.o2m.has(snapshotField.field)) {
    const related = collectionRelations.o2m.get(snapshotField.field)!
    if (isMissing(related.relatedCollection)) {
      rewrites.push({ fromCollection: snapshotField.collection, fromField: snapshotField.field, target: related.relatedCollection })
      return { tsType: 'string[]', extensionOutput: null }
    }
    return { tsType: `${collectionNameToInterfaceName(related.relatedCollection, prefix, singletons)}[] | string[]`, extensionOutput: null }
  }

  // Check extensions before falling through to determineFieldType — a match means this field
  // has a known custom type (e.g. seo-interface → RolleyDirectusLabsSeoPlugin) and its
  // interface body must be emitted once at the top of the generated output
  const extensionMatch = resolveExtensionForField(snapshotField, prefix, extensions)
  if (extensionMatch) {
    return { tsType: extensionMatch.name, extensionOutput: extensionMatch.output }
  }

  // For all remaining non-relation fields the SnapshotField shape is directly compatible
  // with what determineFieldType reads (type, meta.options, meta.interface, meta.special)
  return { tsType: determineFieldType(snapshotField), extensionOutput: null }
}

const ALIAS_SPECIAL_TYPES = new Set(['alias', 'no-data', 'group'])
/**
 * Determines whether a field is a UI-only alias that should be excluded.
 *
 * - Must be of type `alias`.
 * - Must include a known alias special type.
 * - Excludes relation (`m2o`, `o2m`, `m2a`) and file (`file`, `files`) specials.
 *
 * @param field - Field definition from the Directus schema snapshot.
 * @returns `true` if the field is a UI-only alias, otherwise `false`.
 */
function fieldIsUiOnlyAlias(field: SnapshotField): boolean {
  const special = field.meta?.special ?? []
  return (
    field.type === 'alias'
    && special.some(s => ALIAS_SPECIAL_TYPES.has(s))
    && !special.includes('o2m')
    && !special.includes('m2o')
    && !special.includes('m2a')
    && !special.includes('files')
    && !special.includes('file')
  )
}

interface BuiltField {
  interfaceField: InterfaceField
  extensionOutput: string | null
}

/**
 * Builds an interface field definition from a Directus snapshot field.
 *
 * - Skips UI-only alias fields.
 * - Resolves the field type via `resolveFieldTypeString`.
 * - Adds `null` when the field is nullable, not required, and not a primary key.
 * - Marks fields optional if not required and not a primary key.
 * - Preserves sort order.
 *
 * @param snapshotField - Field definition from the Directus schema snapshot.
 * @param collectionRelations - Relation map for the field's collection.
 * @param prefix - Prefix used for generating interface names.
 * @param extensions - Type generation extensions.
 * @param singletons - Set of singleton collection names.
 * @returns Built field definition with optional extension output, or `null` if excluded.
 */
function buildInterfaceField(
  snapshotField: SnapshotField,
  collectionRelations: CollectionRelations | undefined,
  prefix: string,
  extensions: TypegenExtension[],
  singletons: Set<string> = new Set(),
  isMissing: (name: string) => boolean = () => false,
  rewrites: RewriteRecord[] = [],
): BuiltField | null {
  if (fieldIsUiOnlyAlias(snapshotField))
    return null

  const isPrimaryKey = snapshotField.schema?.is_primary_key === true
  const isRequired = snapshotField.meta?.required === true
  const isNullable = snapshotField.schema?.is_nullable !== false

  const { tsType, extensionOutput } = resolveFieldTypeString(snapshotField, collectionRelations, prefix, extensions, singletons, isMissing, rewrites)

  const shouldAppendNull = isNullable && !isRequired && !isPrimaryKey
  const finalType = shouldAppendNull ? `${tsType} | null` : tsType

  return {
    interfaceField: {
      fieldName: snapshotField.field,
      typeString: finalType,
      isOptional: !isPrimaryKey && !isRequired,
      snapshotField,
      sortOrder: snapshotField.meta?.sort ?? 9999,
    },
    extensionOutput,
  }
}

interface GeneratedInterface {
  interfaceBlock: string
  extensionOutputs: string[]
}

/**
 * Generates a TypeScript interface for a collection.
 *
 * - Resolves the interface name from the collection.
 * - Builds and sorts fields using `buildInterfaceField`.
 * - Collects any extension outputs produced by fields.
 * - Generates field declarations with optional JSDoc comments.
 *
 * @param collection - Collection definition from the Directus snapshot.
 * @param allFields - All snapshot fields.
 * @param relationMap - Precomputed relation map.
 * @param prefix - Prefix used for generating interface names.
 * @param extensions - Type generation extensions.
 * @param singletons - Set of singleton collection names.
 * @returns Interface block string and any extension outputs.
 */
function generateInterfaceForCollection(
  collection: SnapshotCollection,
  allFields: SnapshotField[],
  relationMap: RelationMap,
  prefix: string,
  extensions: TypegenExtension[],
  singletons: Set<string> = new Set(),
  isMissing: (name: string) => boolean = () => false,
  rewrites: RewriteRecord[] = [],
): GeneratedInterface {
  const collectionName = collection.collection
  const interfaceName = collectionNameToInterfaceName(collectionName, prefix, singletons)
  const collectionRelations = relationMap.get(collectionName)

  const builtFields = allFields
    .filter(f => f.collection === collectionName)
    .map(f => buildInterfaceField(f, collectionRelations, prefix, extensions, singletons, isMissing, rewrites))
    .filter((f): f is BuiltField => f !== null)
    .sort((a, b) => a.interfaceField.sortOrder - b.interfaceField.sortOrder)

  // Collect any extension interface outputs produced by fields in this collection
  const extensionOutputs = builtFields
    .map(f => f.extensionOutput)
    .filter((o): o is string => o !== null)

  const fieldLines = builtFields.map(({ interfaceField }) => {
    const jsDoc = generateJSDocComment(interfaceField.snapshotField)
    const optionalMarker = interfaceField.isOptional ? '?' : ''
    const declaration = `\t${interfaceField.fieldName}${optionalMarker}: ${interfaceField.typeString};`
    return jsDoc ? `${jsDoc}\t${interfaceField.fieldName}${optionalMarker}: ${interfaceField.typeString};` : declaration
  })

  return {
    interfaceBlock: `interface ${interfaceName} {\n${fieldLines.join('\n')}\n}`,
    extensionOutputs,
  }
}

/**
 * Generates a TypeScript `DirectusSchema` interface string from a list of collections.
 *
 * Each collection is mapped to a property on the resulting interface, where:
 * - The key is the raw collection name.
 * - The value is the corresponding interface type derived via
 *   `collectionNameToInterfaceName`.
 *
 * Behavior:
 *
 * - **Singleton collections** (`meta.singleton === true`):
 *   - Mapped to a single object type.
 *   - Example: `settings: Settings;`
 *
 * - **Regular collections**:
 *   - Mapped to an array of objects.
 *   - Example: `articles: Article[];`
 *
 * The final output is a formatted TypeScript interface definition as a string.
 *
 * @param allCollections - Array of collection definitions from the Directus schema,
 * including metadata such as whether the collection is a singleton.
 * @param prefix - Prefix used when generating interface names for custom collections.
 * @returns A string containing the complete `DirectusSchema` TypeScript interface.
 */
function generateDirectusSchemaInterface(
  allCollections: Array<{ collection: string, meta: { singleton?: boolean } | null }>,
  prefix: string,
  singletons: Set<string> = new Set(),
): string {
  const entries = allCollections.map((collection) => {
    const isSingleton = collection.meta?.singleton === true
    const isDirectusSystemCollection = collectionIsDirectusSystem(collection.collection)
    const interfaceName = collectionNameToInterfaceName(collection.collection, prefix, singletons)
    // System collections use singular (non-array) entries so MergeCoreCollection in the SDK
    // can find the key and merge custom fields into readUsers() / readSettings() / etc.
    // https://directus.io/docs/tutorials/tips-and-tricks/advanced-types-with-the-directus-sdk#custom-fields-on-core-collections
    const valueType = (isSingleton || isDirectusSystemCollection) ? interfaceName : `${interfaceName}[]`
    return `\t${collection.collection}: ${valueType};`
  })

  return `interface DirectusSchema {\n${entries.join('\n')}\n}`
}

/**
 * Generates a TypeScript `enum` containing all collection names.
 *
 * Each collection name is mapped to an enum member where:
 * - The key is the raw collection name.
 * - The value is the same string literal.
 *
 * The enum name is prefixed using the provided `prefix`.
 *
 * @example
 * export enum MyPrefixCollectionNames {
 *   articles = 'articles',
 *   users = 'users'
 * }
 *
 * @param collectionNames - Array of collection names to include in the enum.
 * @param prefix - Prefix applied to the generated enum name.
 * @returns A string containing the TypeScript enum definition.
 */
function generateCollectionNamesEnum(collectionNames: string[], prefix: string): string {
  const entries = collectionNames.map(name => `\t${name} = '${name}'`)
  return `export enum ${prefix}CollectionNames {\n${entries.join(',\n')}\n}`
}

/**
 * Determines the TypeScript type representation for a given field definition.
 *
 * This function maps a field configuration object into a TypeScript type string,
 * preserving Directus string literals (e.g., 'json', 'csv', 'date', 'datetime', 'time')
 *
 * Compatible with both the Directus app field shape and the raw Snapshot field shape
 * from /schema/snapshot. Snapshot options.fields items carry the property name under
 * either `.field` or `.name` depending on the interface — both are handled.
 *
 * @param field - The field configuration object
 * @returns A string representing a valid TypeScript type
 *
 */
function determineFieldType(field: FieldWithRelation): string {
  // Handle translations interface first
  if (field.meta?.special?.includes('translations')) {
    const translationsCollection = field.relation?.collection
    if (translationsCollection) {
      const translationType = pascalCase(singularize(translationsCollection))
      return `${translationType}[] | null`
    }
  }

  // Handle relations
  if (field.relation?.collection) {
    const relatedTypeName = pascalCase(singularize(field.relation.collection))

    switch (field.relation.type) {
      case 'many':
        return `${relatedTypeName}[] | string[]`

      case 'm2a': {
        const allowedCollections = field.relation.allowedCollections

        if (Array.isArray(allowedCollections) && allowedCollections.length > 0) {
          const unionTypes = allowedCollections
            .map((collection: string) => pascalCase(singularize(collection)))
            .join(' | ')
          return `${unionTypes} | string`
        }

        console.warn(
          '[determineFieldType] m2a relation missing allowedCollections. Falling back to string.',
        )
        return 'string'
      }

      default:
        return `${relatedTypeName} | string`
    }
  }

  // Handle choice-based fields
  const choices = field.meta?.options?.choices
  if (Array.isArray(choices) && choices.length > 0) {
    const choiceValues = choices.map(choice =>
      choice.value === null ? 'null' : escapeStringLiteral(choice.value),
    )

    // Deduplicate while preserving order
    const unionOfChoices = [...new Set(choiceValues)].join(' | ')

    const interfacesWithMultiSelect = ['select-multiple', 'select-multiple-dropdown', 'select-multiple-checkbox']
    if (interfacesWithMultiSelect.includes(field.meta.interface)) {
      return `Array<${unionOfChoices}>`
    }

    return unionOfChoices
  }

  // Handle primitive and special field types
  switch (field.type) {
    case 'boolean':
      return 'boolean'

    case 'json': {
      const nestedFields = field.meta?.options?.fields

      if (Array.isArray(nestedFields) && nestedFields.length > 0) {
        const nestedTypes = nestedFields.map((nestedField) => {
          // Snapshot options.fields items carry the property name under .field or .name
          // depending on the interface (e.g. inline-repeater-interface uses .name, list uses .field)
          const propertyName = nestedField.field ?? nestedField.name
          const fieldType = determineFieldType(nestedField)
          return `${propertyName}: ${fieldType}`
        })

        return `Array<{ ${nestedTypes.join('; ')} }>`
      }

      if (field.meta?.interface === 'input-code') {
        return 'Record<string, unknown>'
      }

      if (field.meta?.interface === 'tags') {
        return 'string[]'
      }

      return '\'json\''
    }

    case 'csv':
      return '\'csv\''

    case 'dateTime':
    case 'timestamp':
      return '\'datetime\''

    case 'date':
      return '\'date\''

    case 'time':
      return '\'time\''

    case 'integer':
    case 'bigInteger':
    case 'float':
    case 'decimal':
      return 'number'

    default:
      return 'string'
  }
}

/**
 * Escapes a value into a safe JavaScript string literal representation.
 *
 * @param value - The value to escape into a string literal.
 * @returns A valid JavaScript literal as a string.
 */
function escapeStringLiteral(value: unknown): string {
  switch (typeof value) {
    case 'string': {
      // Escape backslashes first
      const backslashEscaped = value.replace(/\\/g, '\\\\')

      // Simple identifier -> single quotes
      if (/^\w+$/.test(backslashEscaped)) {
        const singleQuoteEscaped = backslashEscaped.replace(/'/g, '\\\'')
        return `'${singleQuoteEscaped}'`
      }

      // Complex -> template literal
      const templateLiteralEscaped = backslashEscaped
        .replace(/`/g, '\\`') // Escape backticks
        .replace(/\$\{/g, '\\${') // Escape ${

      return `\`${templateLiteralEscaped}\``
    }
    case 'boolean':
    case 'number':
      return String(value)
    case 'undefined':
      return 'null'
    default:
      if (value === undefined || value === null) {
        return 'null'
      }
      return JSON.stringify(value)
  }
}

/**
 * Generates a safe, single-line JSDoc comment string for a given field definition.
 *
 * It conditionally includes:
 * - `@description` if a note is present (tanslations start with `$t` and are ignored )
 * - `@primaryKey` if the field is marked as a primary key
 * - `@required` if the field is required
 */
function generateJSDocComment(field: SnapshotField): string {
  const comments = []

  // Skip fields with translation descriptions for now
  if (field.meta?.note && !field.meta.note.startsWith('$t')) {
    comments.push(`@description ${field.meta.note}`)
  }

  // Handle primary key
  if (field.schema?.is_primary_key) {
    comments.push('@primaryKey')
  }

  // Handle required
  if (field.meta?.required) {
    comments.push('@required')
  }

  return comments.length > 0 ? `\t/** ${comments.join(' ')} */\n` : ''
}

/**
 * Converts a string into PascalCase.
 *
 * The function splits the input string by spaces, underscores, or hyphens,
 * capitalizes the first letter of each resulting word, and joins them together
 * without separators.
 *
 * @param value - The input string to convert.
 * @returns The PascalCase version of the input string.
 *
 * @example
 * pascalCase('hello world') => "HelloWorld"
 * pascalCase('user_name') => "UserName"
 * pascalCase('convert-to pascal_case') => "ConvertToPascalCase"
 *
 */
function pascalCase(value: string): string {
  return value
    .split(/[\s_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

type SingularizeRule = (word: string) => string | null

// Note: This is not intended to be exhaustive. Some examples are present only to demonstrate reasons for
const singularizeExceptions = new Map<string, string>([
  // invariant (same singular/plural)
  ['sheep', 'sheep'],
  ['fish', 'fish'],
  ['series', 'series'],
  ['species', 'species'],
  ['deer', 'deer'],
  ['aircraft', 'aircraft'],
  ['news', 'news'],

  // irregular
  ['children', 'child'],
  ['men', 'man'],
  ['women', 'woman'],
  ['teeth', 'tooth'],
  ['feet', 'foot'],
  ['mice', 'mouse'],
  ['geese', 'goose'],
  ['oxen', 'ox'],

  // -ves special cases (fe endings)
  ['knives', 'knife'],
  ['wives', 'wife'],
  ['lives', 'life'],
  ['leaves', 'leaf'],
  ['loaves', 'loaf'],
  ['wolves', 'wolf'],
  ['calves', 'calf'],
  ['halves', 'half'],
  ['selves', 'self'],
  ['elves', 'elf'],

  // Latin / Greek
  ['analyses', 'analysis'],
  ['diagnoses', 'diagnosis'],
  ['theses', 'thesis'],
  ['crises', 'crisis'],
  ['phenomena', 'phenomenon'],
  ['criteria', 'criterion'],

  // -us -> -i
  ['cacti', 'cactus'],
  ['fungi', 'fungus'],
  ['nuclei', 'nucleus'],
  ['syllabi', 'syllabus'],

  // -a -> -um
  ['bacteria', 'bacterium'],
  ['curricula', 'curriculum'],

  // exceptions to oes -> o
  ['toes', 'toe'],
])

const singularizeRules: SingularizeRule[] = [
  // ies -> y
  (word) => {
    if (word.endsWith('ies') && word.length > 3) {
      return `${word.slice(0, -3)}y`
    }
    return null
  },

  // oes -> o
  (word) => {
    if (word.endsWith('oes')) {
      return word.slice(0, -2)
    }
    return null
  },

  // es -> remove (ch, sh, s, x, z)
  (word) => {
    if (/(?:ch|sh|[sxz])es$/.test(word)) {
      return word.slice(0, -2)
    }
    return null
  },

  // fallback: trailing s (guarded)
  (word) => {
    if (
      word.endsWith('s')
      && !word.endsWith('ss') // class
      && word.length > 3
      && !word.endsWith('us') // bonus
      && !word.endsWith('is') // basis
    ) {
      return word.slice(0, -1)
    }
    return null
  },
]

/**
 * Converts a plural English word to its singular form.
 *
 * The function applies the following strategy:
 * 1. Normalize the input to lowercase
 * 2. Check for known exceptions (irregular or invariant forms)
 * 3. Apply pattern-based transformation rules in order
 * 4. Return the original word if no rule applies
 *
 * @param word - The word to singularize.
 * @returns The singular form of the word, or the original word if no transformation applies.
 *
 * @example
 * singularize('children') => "child"
 * singularize('stories') => "story"
 * singularize('boxes') => "box"
 * singularize('cats') => "cat"
 * singularize('fish') => "fish"
 * singularize('') => ""
 */
function singularize(word: string): string {
  if (!word || typeof word !== 'string')
    return ''

  const lower = word.toLowerCase()

  // exceptions first
  const exception = singularizeExceptions.get(lower)
  if (exception)
    return exception

  // apply rules
  for (const rule of singularizeRules) {
    const result = rule(lower)
    if (result)
      return result
  }

  // no exceptions and no rules apply
  return word
}
