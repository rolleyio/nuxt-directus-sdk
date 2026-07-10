# Data Fetching

nuxt-directus-sdk ships typed data fetching composables on two levels:

- **`useAsyncData` composables** (always available): `useDirectusItems()`, `useDirectusItem()` and `useDirectusSingleton()` wrap the Directus SDK in Nuxt's native `useAsyncData`, with SSR payload transfer and deterministic keys handled for you.
- **Pinia Colada queries** (auto-enabled): with [`@pinia/colada`](https://pinia-colada.esm.dev) installed, the module adds cached query composables on top.

All of them are fully typed against your generated `DirectusSchema`, including query `fields` narrowing.

There is also an experimental third level, [vue-router data loaders](/guide/experimental-data-loaders), which fetch during navigation instead of component setup.

## useAsyncData Composables

These work out of the box with no extra dependencies.

### `useDirectusItems()`

Fetch a list of items from a collection:

```vue
<script setup lang="ts">
const { data: posts, pending, error, refresh } = await useDirectusItems('posts', {
  query: {
    filter: { status: { _eq: 'published' } },
    sort: ['-date_created'],
    limit: 10,
  },
})
</script>
```

### `useDirectusItem()`

Fetch a single item by primary key:

```vue
<script setup lang="ts">
const route = useRoute()

const { data: post } = await useDirectusItem('posts', route.params.id as string, {
  query: { fields: ['*', { author: ['name'] }] },
})
</script>
```

### `useDirectusSingleton()`

Fetch a singleton collection (like site settings):

```vue
<script setup lang="ts">
const { data: settings } = await useDirectusSingleton('settings')
</script>
```

All three accept the standard `useAsyncData` options (`immediate`, `lazy`, `watch`, `server`, ...) plus an optional `key` to override the generated one. Keys default to `directus:{kind}:{collection}:{query}` so identical calls share one fetch.

## Pinia Colada Queries

[Pinia Colada](https://pinia-colada.esm.dev) is the data fetching layer for pinia. Where `useAsyncData` fetches per key/page, Colada gives you an app-wide normalized cache: every component calling the same key shares one entry, `staleTime` controls background refetches, and mutations can invalidate keys.

### Setup

Install the packages and the composables enable automatically:

```bash
pnpm add @pinia/colada @pinia/colada-nuxt @pinia/nuxt pinia
```

When `@pinia/colada` is detected, nuxt-directus-sdk:

- registers `@pinia/nuxt` and `@pinia/colada-nuxt` (if not already in your `modules`)
- auto-imports `useDirectusItemsQuery()`, `useDirectusItemQuery()` and `useDirectusSingletonQuery()`

`@pinia/colada-nuxt` handles SSR hydration, so data fetched on the server is not refetched on the client. Set `piniaColada: false` in the module options to disable the integration even when the package is installed.

### Query Composables

The `*Query` composables mirror the `useAsyncData` ones, but go through the Colada cache:

```vue
<script setup lang="ts">
// Shared by key across the whole app: calling this in a header and a
// sidebar triggers a single request.
const { data: navigation, isLoading } = useDirectusItemsQuery('pages', {
  query: { filter: { show_in_nav: { _eq: true } } },
  staleTime: 1000 * 60 * 5, // fresh for 5 minutes
})
</script>
```

Pass a ref or getter as the item id (or as `query`) and the entry key tracks it, refetching when it changes:

```vue
<script setup lang="ts">
const route = useRoute()

const { data: post, asyncStatus } = useDirectusItemQuery('posts', () => route.params.id as string)
</script>
```

They accept all `useQuery` options (`staleTime`, `gcTime`, `enabled`, `refetchOnWindowFocus`, ...) plus an optional `key` override. Keys default to `['directus', kind, collection, ...]` so you can target them with `useQueryCache()` invalidation after a mutation:

```ts
const queryCache = useQueryCache()

await directus.request(createItem('posts', newPost))
queryCache.invalidateQueries({ key: ['directus', 'items', 'posts'] })
```

### Which One Should I Use?

| | `useAsyncData` composables | Colada queries | [Data loaders](/guide/experimental-data-loaders) |
| --- | --- | --- | --- |
| Extra dependencies | none | `@pinia/colada` | `@pinia/colada` |
| Stability | stable | stable | experimental |
| Cache scope | per key, payload-based | app-wide, normalized | app-wide, normalized |
| Background refetch | manual (`refresh`) | `staleTime` / `refetchOn*` | `staleTime` / `refetchOn*` |
| Runs | component setup | component setup | during navigation |
| Best for | simple pages, minimal deps | shared data (nav, settings, lists) | route-driven page data |

If you are already using Pinia Colada (or fetch the same data in several components), prefer the Colada layer. Otherwise the `useAsyncData` composables are all you need. For route-driven page data where you want the fetch to happen during navigation, look at the experimental [data loaders](/guide/experimental-data-loaders).

## Content Versions

For collections with [content versioning](https://directus.com/docs/guides/content/content-versioning) enabled, pass `version` in the query to fetch a specific version instead of the published item. This works on the single-item and singleton composables in both families:

```vue
<script setup lang="ts">
const route = useRoute()

// Fetch the draft version, e.g. behind a preview flag
const preview = route.query.preview === 'true'

const { data: post } = await useDirectusItem('posts', route.params.id as string, {
  query: {
    fields: ['*'],
    ...(preview ? { version: 'draft' } : {}),
  },
})
</script>
```

The version is part of the generated cache key, so a draft fetch never collides with the published entry. Add `versionRaw: true` to receive the raw version delta instead of the version merged onto the main item.

::: tip Directus 12 Editorial Workflows
Directus 12 makes draft and published states explicit: published items in versioned collections are locked and edits happen on drafts. The `main` version was renamed, so use `version: 'published'` where you previously used `version: 'main'`. Reading a draft requires a token or session with permission to read versions, so wire preview modes through [server routes](/guide/server-side) or an authenticated session rather than exposing drafts publicly.
:::
