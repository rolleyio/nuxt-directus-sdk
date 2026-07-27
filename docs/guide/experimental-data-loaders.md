# Data Loaders

::: warning Experimental
Data loaders build on vue-router's experimental data loader API (`vue-router/experimental`). The module isolates you from most of the surface through `defineDirectusLoader()`, but the underlying behaviour may change between vue-router releases, which is why this feature lives under `experimental` and is off by default. See the [vue-router data loaders docs](https://router.vuejs.org/data-loaders/) for details.
:::

Data loaders run during navigation, inside the router guard, so page data is ready on first paint: no `await` in setup blocking hydration, and no loading flash on client-side navigation. `defineDirectusLoader()` wraps vue-router's `defineColadaLoader()` and injects the Directus client, sharing the same [Pinia Colada cache](/guide/data-fetching#pinia-colada-queries) as the query composables.

## Setup

Data loaders require the [Pinia Colada packages](/guide/data-fetching#setup) and an explicit opt-in:

```ts
export default defineNuxtConfig({
  directus: {
    experimental: {
      dataLoaders: true,
    },
  },
})
```

If your app already registers the `DataLoaderPlugin` itself, keep your plugin and skip the module's:

```ts
export default defineNuxtConfig({
  directus: {
    experimental: {
      dataLoaders: {
        registerPlugin: false,
      },
    },
  },
})
```

When enabled, the module auto-imports `defineDirectusLoader()` and registers the vue-router `DataLoaderPlugin` for you.

## Defining a Loader

Define the loader in a non-setup `<script>` block and export it from the page component so the router picks it up:

```vue
<script lang="ts">
export const usePostLoader = defineDirectusLoader({
  key: to => ['posts', to.params.slug as string],
  query: (directus, to) => directus.request(readItems('posts', {
    filter: { slug: { _eq: to.params.slug as string } },
    limit: 1,
  })).then(posts => posts[0] ?? null),
  staleTime: 1000 * 60 * 5,
})
</script>

<script setup lang="ts">
const { data: post, isLoading, refresh } = usePostLoader()
</script>
```

The `query` function receives the Directus client, the target route, and the loader context (whose `signal` aborts when the navigation is cancelled). All `defineColadaLoader()` options are supported (`staleTime`, `lazy`, `server`, `commit`, ...).

Loaders share the Colada cache with the query composables: a loader with key `['posts', slug]` and a `useQuery` with the same key deduplicate into one entry, one request, and one SSR hydration payload.

## Guaranteed Data: Throw to Abort Navigation

Because loaders run inside the navigation guard, throwing aborts the navigation before the page ever renders. That gives you a guarantee the `useAsyncData` and query composables cannot: if the component renders at all, `data` is exactly what the loader returned. No `v-if="post"` guards for the impossible states, no half-rendered pages when a record is missing.

```ts
export const usePageLoader = defineDirectusLoader({
  key: to => ['pages', to.params.slug as string],
  query: async (directus, to) => {
    const pages = await directus.request(readItems('pages', {
      filter: { slug: { _eq: to.params.slug as string } },
      limit: 1,
    }))

    // Throwing aborts the navigation and renders the error page instead,
    // so every component on this route can trust that `page` exists.
    if (!pages[0]) {
      throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }

    return pages[0]
  },
})
```

You can validate shape as well as existence: parse the response with your own checks (or a schema library) and throw when the CMS content is not what the page requires, turning bad content into a navigation error instead of a rendering bug.

To redirect instead of erroring, return a `NavigationResult`:

```ts
import { NavigationResult } from 'vue-router/experimental'

export const useDraftGuardLoader = defineDirectusLoader({
  key: to => ['posts', to.params.slug as string],
  query: async (directus, to) => {
    const post = await fetchPost(directus, to)

    if (post?.status !== 'published') {
      return new NavigationResult('/blog')
    }

    return post
  },
})
```
