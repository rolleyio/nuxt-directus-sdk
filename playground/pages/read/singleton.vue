<script setup lang="ts">
  import { readSingleton, useDirectus } from '#imports'

  const directus = useDirectus()
  const singleton = await directus.request(readSingleton('globals'))
</script>
<template>
  <h1>Read a Singleton</h1>

  {{ singleton }}
</template>
