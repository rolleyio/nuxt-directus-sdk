# Type Generation Improvement Proposal

## Current Implementation

Your current implementation (`src/runtime/types/generate.ts`):
- ✅ Fetches collections, fields, and relations directly from Directus API
- ✅ Builds types manually by analyzing field types
- ✅ Handles relations between collections
- ❌ ~250 lines of custom type mapping logic
- ❌ Requires maintaining field type mappings manually
- ❌ May miss edge cases or newer Directus field types
- ❌ Uses outdated authentication mode (`'json'` instead of `'session'`)

## Recommended Approach: Use `openapi-typescript`

Directus provides an OpenAPI spec at `/server/specs/oas` which is officially maintained and includes all field types, relations, and edge cases.

### Why This is Better

1. **Official & Complete**: Uses Directus's own OpenAPI spec (always up-to-date)
2. **Less Code**: ~50 lines instead of ~250 lines
3. **Better Types**: openapi-typescript generates more accurate types
4. **Maintained**: openapi-typescript is actively maintained
5. **Standard**: Uses industry-standard OpenAPI → TypeScript conversion

### Implementation

#### 1. Install Dependencies

```bash
npm install -D openapi-typescript
```

#### 2. Updated `src/runtime/types/generate.ts`

```typescript
import openapiTS from 'openapi-typescript'
import { useLogger } from '@nuxt/kit'

export interface GenerateOptions {
  url: string
  token: string
  prefix?: string
}

export async function generateTypes(options: GenerateOptions) {
  const logger = useLogger('nuxt-directus-sdk')

  try {
    // Fetch OpenAPI spec from Directus
    const specUrl = `${options.url}/server/specs/oas`

    // Generate TypeScript types from OpenAPI spec
    const output = await openapiTS(specUrl, {
      auth: `Bearer ${options.token}`,
      transform(schemaObject, metadata) {
        // Transform collection names to PascalCase if needed
        if (metadata.path?.startsWith('/items/') && schemaObject.type === 'object') {
          const collectionName = metadata.path.split('/')[2]
          if (collectionName && !collectionName.startsWith('directus_')) {
            // Apply prefix for custom collections
            return {
              ...schemaObject,
              'x-collection-name': options.prefix
                ? `${options.prefix}${collectionName}`
                : collectionName
            }
          }
        }
        return schemaObject
      },
      exportType: true, // Use `export type` instead of `export interface`
    })

    // Extract paths types for Directus collections
    const collectionsTypes = extractCollectionTypes(output)

    return `
declare global {
  ${collectionsTypes}

  interface DirectusSchema {
    ${generateSchemaTypes(output)}
  }

  interface AllDirectusCollections extends DirectusSchema {
    ${generateAllCollections(output)}
  }
}

export {};
`
  } catch (error) {
    logger.error(`Failed to generate types from OpenAPI spec: ${error}`)
    throw error
  }
}

function extractCollectionTypes(openapiOutput: string): string {
  // Parse the generated types and extract collection interfaces
  // This depends on the structure of openapi-typescript output
  // You can customize this based on your needs
  return openapiOutput
}

function generateSchemaTypes(openapiOutput: string): string {
  // Generate DirectusSchema interface from paths
  return ''
}

function generateAllCollections(openapiOutput: string): string {
  // Generate AllDirectusCollections interface
  return ''
}
```

#### 3. Even Simpler: Direct CLI Approach

Alternatively, you can use openapi-typescript CLI directly:

**Create `.directus/redocly.yaml`:**
```yaml
resolve:
  http:
    headers:
      - matches: ${DIRECTUS_URL}/**
        name: Authorization
        envVariable: DIRECTUS_BEARER_TOKEN
```

**Add npm script to `package.json`:**
```json
{
  "scripts": {
    "generate:types": "openapi-typescript ${DIRECTUS_URL}/server/specs/oas --output src/runtime/types/directus.d.ts --redocly .directus/redocly.yaml"
  }
}
```

**Set environment variable:**
```bash
export DIRECTUS_BEARER_TOKEN="Bearer your_admin_token"
npm run generate:types
```

### Hybrid Approach (Recommended)

Use `openapi-typescript` programmatically but post-process to create the exact interface structure you need:

```typescript
import openapiTS, { astToString } from 'openapi-typescript'
import ts from 'typescript'

export async function generateTypes(options: GenerateOptions) {
  const specUrl = `${options.url}/server/specs/oas`

  // Generate AST from OpenAPI spec
  const ast = await openapiTS(new URL(specUrl), {
    auth: `Bearer ${options.token}`,
    exportType: true,
  })

  // Convert AST to string
  const rawTypes = astToString(ast)

  // Post-process to extract only collection schemas
  const collections = extractCollectionsFromOpenAPI(rawTypes)

  // Generate your custom interface structure
  return buildDirectusInterfaces(collections, options.prefix)
}

function extractCollectionsFromOpenAPI(types: string) {
  // Parse openapi-typescript output
  // Extract types from paths like /items/{collection}
  // Map to your desired structure
}

function buildDirectusInterfaces(collections: any, prefix: string) {
  // Build the final interface structure you need
  return `
declare global {
  // Generated interfaces...
  interface DirectusSchema { ... }
  interface AllDirectusCollections { ... }
}

export {};
`
}
```

## Migration Path

### Phase 1: Add openapi-typescript (Low Risk)
1. Install `openapi-typescript`
2. Keep your current implementation
3. Add a comparison mode to validate both generate identical types
4. Test thoroughly

### Phase 2: Switch Default (Medium Risk)
1. Make openapi-typescript the default
2. Keep old implementation as fallback
3. Monitor for issues

### Phase 3: Remove Old Code (High Confidence)
1. Remove custom type generation
2. Delete `src/runtime/types/generate.ts` old code
3. Reduce bundle size and maintenance burden

## Pros & Cons

### openapi-typescript Approach

**Pros:**
- ✅ Official OpenAPI spec (always accurate)
- ✅ Less custom code to maintain
- ✅ Handles all edge cases automatically
- ✅ Better support for new Directus features
- ✅ Industry-standard tool
- ✅ Better TypeScript type accuracy

**Cons:**
- ⚠️ Need to post-process output to match your interface structure
- ⚠️ May generate more types than needed
- ⚠️ Requires testing to ensure output matches expectations

### Current Custom Approach

**Pros:**
- ✅ Full control over output format
- ✅ Only generates exactly what you need
- ✅ Already working and tested

**Cons:**
- ❌ ~250 lines of custom logic to maintain
- ❌ May miss new Directus field types
- ❌ Have to manually map field types
- ❌ Edge cases may not be handled
- ❌ Using deprecated auth mode

## Recommendation

**Use openapi-typescript with post-processing** (Hybrid Approach)

This gives you:
1. Reliability of official OpenAPI spec
2. Control over output format
3. Less maintenance burden
4. Future-proof as Directus evolves

The post-processing step lets you maintain your current interface structure while leveraging the accuracy of OpenAPI spec.

## Alternative: Directus TypeForge

If post-processing is too complex, consider **Directus TypeForge** (https://jovianmoon.io/projects/directus-typeforge) - it's specifically built for Directus and handles the SDK interface structure automatically.

## Action Items

1. ✅ Review this proposal
2. ⬜ Decide on approach (openapi-typescript vs TypeForge vs keep current)
3. ⬜ If using openapi-typescript:
   - Install dependency
   - Create proof-of-concept
   - Compare output with current implementation
   - Test with your Directus instance
4. ⬜ Implement chosen solution
5. ⬜ Update documentation

Would you like me to implement the hybrid approach with openapi-typescript?
