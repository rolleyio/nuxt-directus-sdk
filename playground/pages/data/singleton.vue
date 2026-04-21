<script setup lang="ts">
import { readSingleton, useDirectus } from '#imports'

const directus = useDirectus()
const singleton = await directus.request(readSingleton('globals'))
//TODO: reword this to better reflect the auto-imports added recently.
</script>

<template>
  <div>
    <h1>Request Singleton</h1>
    <p>Demonstrates <code>readSingleton()</code> from the Directus SDK via <code>useDirectus()</code>.</p>
    <p class="note">
      This is meant to use an extremely simple example of using the request functions auto-imported by the SDK.
      Notice in the playground code that the import is coming from <code>#imports</code>.
      This is because auto-imports have been disabled in this project, you likely will not to import anything in your project.
    </p>

    <pre>{{ JSON.stringify(singleton, null, 2) }}</pre>
  </div>
</template>
