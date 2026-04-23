<script setup lang="ts">
import { readSingleton, useDirectus } from '#imports'

const directus = useDirectus()
const globals = await directus.request(readSingleton('globals'))
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">
        SDK Auto-Imports
      </h1>
      <p class="text-muted">
        This module automatically imports all user-facing request functions from <code class="text-xs bg-elevated px-1 py-0.5 rounded">@directus/sdk</code>
        (like <code class="text-xs bg-elevated px-1 py-0.5 rounded">readItems</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">readSingleton</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">createItem</code>, etc.) so you can
        use them in your components without any import statement.
      </p>
    </div>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        Auto-imported: request functions
      </h2>
      <p class="text-sm text-muted mb-3">
        Every request command exported by <code class="text-xs bg-elevated px-1 py-0.5 rounded">@directus/sdk</code> is available globally in your project.
        The example below calls <code class="text-xs bg-elevated px-1 py-0.5 rounded">readSingleton('globals')</code> with no import statement required in a
        real project.
      </p>

      <p class="text-xs text-muted italic border-l-2 border-default pl-3 mb-3">
        The playground you are viewing has nuxt auto-imports <strong>disabled</strong>.
        You will not likely need to import anything to use this module in your project.
      </p>
      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mb-4">// This playground uses #imports to make the source explicit:
import { readSingleton, useDirectus } from '#imports'

// In your project — just use it, no import needed:
const directus = useDirectus()
const globals = await directus.request(readSingleton('globals'))</pre>

      <p class="text-sm font-semibold mb-1">
        Live result — <code class="text-xs bg-elevated px-1 py-0.5 rounded">globals</code> singleton:
      </p>
      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto">{{ JSON.stringify(globals, null, 2) }}</pre>
    </section>

    <section class="pt-6 border-t border-default">
      <h2 class="text-base font-semibold mb-2">
        Manual imports: client factories
      </h2>
      <p class="text-sm text-muted mb-3">
        A small set of functions are intentionally <strong>excluded</strong> from auto-imports and must always be imported from <code class="text-xs bg-elevated px-1 py-0.5 rounded">@directus/sdk</code> directly:
      </p>
      <ul class="list-disc pl-6 text-sm text-muted space-y-2 mb-3">
        <li>
          <strong>Client factories</strong> (<code class="text-xs bg-elevated px-1 py-0.5 rounded">createDirectus</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">rest</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">graphql</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">staticToken</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">realtime</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">authentication</code>): module-level setup utilities, not per-request commands.
        </li>
        <li>
          <strong>Module-wrapped functions</strong> (<code class="text-xs bg-elevated px-1 py-0.5 rounded">readMe</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">updateMe</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">createUser</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">uploadFiles</code>, etc.): the module exposes these through its own composables (e.g. <code class="text-xs bg-elevated px-1 py-0.5 rounded">useDirectusAuth()</code>) with added conveniences.
        </li>
        <li>
          <strong>SDK internals</strong> (<code class="text-xs bg-elevated px-1 py-0.5 rounded">throwIfEmpty</code>, <code class="text-xs bg-elevated px-1 py-0.5 rounded">queryToParams</code>, etc.): implementation details not intended for direct use.
        </li>
      </ul>
      <p class="text-sm text-muted mb-3">
        The most common case where you will reach for a manual import is building a <strong>standalone client</strong> with a static token, for example a public read-only client that bypasses the session-based <code class="text-xs bg-elevated px-1 py-0.5 rounded">useDirectus()</code>:
      </p>

      <pre class="bg-elevated border border-default rounded p-4 text-xs overflow-x-auto mb-3">import { createDirectus, rest, staticToken } from '@directus/sdk'

const publicClient = createDirectus('https://your-directus.example.com')
  .with(staticToken('your-static-token'))
  .with(rest())

const data = await publicClient.request(readItems('posts'))</pre>

      <p class="text-xs text-muted italic border-l-2 border-default pl-3">
        On the server side, this module provides <code>useAdminDirectus()</code> and <code>useSessionDirectus(event)</code> in Nitro API routes to handle client setup for you.
        See the <NuxtLink to="/server-utils" class="text-primary hover:underline">
          Server Composables
        </NuxtLink> demo.
      </p>
    </section>
  </div>
</template>
