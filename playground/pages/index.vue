<script setup lang="ts">
import { useNav } from '../composables/useNav'

const nav = useNav().filter(group => group.label !== 'Overview')
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">
        nuxt-directus-sdk Playground
      </h1>
      <p class="text-muted">
        Interactive examples for every composable and function exported by this module.
        Use the sidebar to navigate between demos.
      </p>
    </div>

    <section
      v-for="group in nav"
      :key="group.label"
      class="space-y-3"
    >
      <h2 class="text-lg font-semibold">
        {{ group.label }}
      </h2>
      <ul class="space-y-2">
        <li
          v-for="link in group.links"
          :key="link.to"
          class="text-sm"
        >
          <NuxtLink :to="link.to" class="text-primary font-medium hover:underline">
            {{ link.label }}
          </NuxtLink>
          <template v-if="link.description">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span class="text-muted"> — <span v-html="link.description" /></span>
          </template>
        </li>
      </ul>
    </section>
  </div>
</template>
