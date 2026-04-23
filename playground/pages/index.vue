<script setup lang="ts">
import { useNav } from '../composables/useNav'

const nav = useNav().filter(group => group.label !== 'Overview')
</script>

<template>
  <div>
    <h1>nuxt-directus-sdk Playground</h1>
    <p>
      Interactive examples for every composable and function exported by this module.
      Use the sidebar to navigate between demos.
    </p>

    <template
      v-for="group in nav"
      :key="group.label"
    >
      <h2>{{ group.label }}</h2>
      <ul class="demo-list">
        <li
          v-for="link in group.links"
          :key="link.to"
        >
          <NuxtLink :to="link.to">
            {{ link.label }}
          </NuxtLink>
          <template v-if="link.description">
            <!-- eslint-disable-next-line vue/no-v-html -->
            - <span v-html="link.description" />
          </template>
        </li>
      </ul>
    </template>
  </div>
</template>
