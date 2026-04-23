<script setup lang="ts">
import { readSingleton, useDirectus } from '#imports'

const directus = useDirectus()
const globals = await directus.request(readSingleton('globals'))
</script>

<template>
  <div>
    <h1>SDK Auto-Imports</h1>
    <p>
      This module automatically imports all user-facing request functions from <code>@directus/sdk</code>
      (like <code>readItems</code>, <code>readSingleton</code>, <code>createItem</code>, etc.) so you can
      use them in your components without any import statement.
    </p>

    <div class="demo-section">
      <h2>Auto-imported: request functions</h2>
      <p>
        Every request command exported by <code>@directus/sdk</code> is available globally in your project.
        The example below calls <code>readSingleton('globals')</code> with no import statement required in a
        real project.
      </p>

      <p class="note">
        The playground you are viewing has nuxt auto-imports <strong>disabled</strong>.
        You will not likely need to import anything to use this module in your project.
      </p>
      <pre>
// This playground uses #imports to make the source explicit:
import { readSingleton, useDirectus } from '#imports'

// In your project — just use it, no import needed:
const directus = useDirectus()
const globals = await directus.request(readSingleton('globals'))
      </pre>

      <p><strong>Live result — <code>globals</code> singleton:</strong></p>
      <pre>{{ JSON.stringify(globals, null, 2) }}</pre>
    </div>

    <div class="demo-section">
      <h2>Manual imports: client factories</h2>
      <p>
        A small set of functions are intentionally <strong>excluded</strong> from auto-imports and must always be imported from <code>@directus/sdk</code> directly:
      </p>
      <ul style="margin: 0 0 12px 20px; color: #555; font-size: 13px; line-height: 2">
        <li>
          <strong>Client factories</strong> (<code>createDirectus</code>, <code>rest</code>, <code>graphql</code>, <code>staticToken</code>, <code>realtime</code>, <code>authentication</code>): module-level setup utilities, not per-request commands.
        </li>
        <li>
          <strong>Module-wrapped functions</strong> (<code>readMe</code>, <code>updateMe</code>, <code>createUser</code>, <code>uploadFiles</code>, etc.): the module exposes these through its own composables (e.g. <code>useDirectusAuth()</code>) with added conveniences.
        </li>
        <li>
          <strong>SDK internals</strong> (<code>throwIfEmpty</code>, <code>queryToParams</code>, etc.): implementation details not intended for direct use.
        </li>
      </ul>
      <p>
        The most common case where you will reach for a manual import is building a <strong>standalone client</strong> with a static token, for example a public read-only client that bypasses the session-based <code>useDirectus()</code>:
      </p>

      <pre>
import { createDirectus, rest, staticToken } from '@directus/sdk'

const publicClient = createDirectus('https://your-directus.example.com')
  .with(staticToken('your-static-token'))
  .with(rest())

const data = await publicClient.request(readItems('posts'))</pre>

      <p class="note">
        On the server side, this module provides <code>useAdminDirectus()</code> and <code>useSessionDirectus(event)</code> in Nitro API routes to handle client setup for you.
        See the <NuxtLink to="/server">
          Server Composables
        </NuxtLink> demo.
      </p>
    </div>
  </div>
</template>
