<script lang="ts">
import { defineDirectusLoader, readItems, useDirectusSingletonQuery } from '#imports'

// Data loader: runs in the router's navigation guard, so the posts are ready
// before the page renders. Export the loader from the page component so the
// router picks it up.
export const usePostsLoader = defineDirectusLoader({
  key: ['playground', 'posts'],
  query: directus => directus.request(readItems('posts', {
    fields: ['id', 'title', 'slug'],
    sort: ['-date_created'],
    limit: 5,
  })),
  staleTime: 1000 * 60, // fresh for a minute; instant back/forward navigation
})
</script>

<script setup lang="ts">
const { data: posts, isLoading: postsLoading, refetch } = usePostsLoader()

// Cached query composable: shared by key across every component that calls
// it, so mounting this section twice still fires a single request.
const { data: globals, asyncStatus } = useDirectusSingletonQuery('globals', {
  staleTime: 1000 * 60 * 5,
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">
        Pinia Colada
      </h1>
      <p class="text-muted">
        With <code class="text-xs bg-elevated px-1 py-0.5 rounded">@pinia/colada</code> installed, the module adds cached query composables on top of the Directus SDK. Router data loaders are opt-in via <code class="text-xs bg-elevated px-1 py-0.5 rounded">experimental.dataLoaders</code>.
      </p>
    </div>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        Data loader: <code class="text-xs bg-elevated px-1 py-0.5 rounded">defineDirectusLoader()</code>
      </h2>
      <p class="text-sm text-muted mb-3">
        Loaders run during navigation, so the data is ready on first paint with no <code class="text-xs bg-elevated px-1 py-0.5 rounded">await</code> in setup and no loading flash on client-side navigation.
      </p>

      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mb-4">// &lt;script lang="ts"&gt; (non-setup block, exported from the page)
export const usePostsLoader = defineDirectusLoader({
  key: ['playground', 'posts'],
  query: directus =&gt; directus.request(readItems('posts', { limit: 5 })),
  staleTime: 1000 * 60,
})

// &lt;script setup lang="ts"&gt;
const { data: posts, isLoading } = usePostsLoader()</pre>

      <p class="text-sm font-semibold mb-1">
        Live result:
      </p>
      <p
        v-if="postsLoading"
        class="text-sm text-muted"
      >
        Loading posts...
      </p>
      <pre
        v-else
        class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mb-3"
      >{{ JSON.stringify(posts, null, 2) }}</pre>
      <UButton
        size="xs"
        variant="soft"
        @click="refetch()"
      >
        Refetch posts
      </UButton>
    </section>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        Cached queries: <code class="text-xs bg-elevated px-1 py-0.5 rounded">useDirectusItemsQuery()</code> and friends
      </h2>
      <p class="text-sm text-muted mb-3">
        <code class="text-xs bg-elevated px-1 py-0.5 rounded">useDirectusItemsQuery()</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">useDirectusItemQuery()</code> and <code class="text-xs bg-elevated px-1 py-0.5 rounded">useDirectusSingletonQuery()</code> mirror the <code class="text-xs bg-elevated px-1 py-0.5 rounded">useAsyncData</code> composables but share one cache entry per key across the whole app, with <code class="text-xs bg-elevated px-1 py-0.5 rounded">staleTime</code> controlling refetches.
      </p>

      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mb-4">const { data: globals, asyncStatus } = useDirectusSingletonQuery('globals', {
  staleTime: 1000 * 60 * 5,
})</pre>

      <p class="text-sm font-semibold mb-1">
        Live result (<code class="text-xs bg-elevated px-1 py-0.5 rounded">{{ asyncStatus }}</code>):
      </p>
      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto">{{ JSON.stringify(globals, null, 2) }}</pre>
    </section>
  </div>
</template>
