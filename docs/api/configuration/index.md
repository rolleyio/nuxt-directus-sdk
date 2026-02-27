---
outline: [2, 3]
---

# Configuration Reference

Complete reference for all nuxt-directus-sdk configuration options.

## Module Options

<!--@include: ./module.md{7,}-->

## Environment Variables

<!--@include: ./env.md{7,}-->

## Directus Server Configuration

<!--@include: ./server.md{7,}-->

## TypeScript Configuration

The module automatically adds type declarations. Ensure your `tsconfig.json` extends Nuxt's config:

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

Generated types are available globally:

```typescript
// Access generated types
type Article = DirectusSchema['articles']
type User = DirectusUsers
type File = DirectusFiles

// Use with Directus SDK
const directus = useDirectus()
const articles = await directus.request(readItems('articles'))
// articles is typed as Article[]
```

## See Also

- [Getting Started](/guide/getting-started)
- [Authentication Guide](/guide/authentication)
- [Server-Side Utils](/guide/server-side)
- [Composables Reference](/api/composables)
