<script setup lang="ts">
import { readItems, useAsyncData, useDirectus } from '#imports'

const directus = useDirectus()

const { data: posts } = await useAsyncData('posts', () => {
  return directus.request(
    readItems('posts', {
      fields: [
        'id',
        'title',
        { author: ['first_name', 'last_name'] },
        'slug',
        'published_at',
      ],
      sort: '-published_at',
      filter: { status: { _eq: 'published' } },
    }),
  )
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">
      View Blog Posts
    </h1>
    <div class="space-y-3">
      <UCard
        v-for="post in posts"
        :key="post.id"
        class="hover:ring-2 hover:ring-primary/40 transition"
      >
        <NuxtLink :to="`/blog/${post.slug}`" class="block">
          <h2 class="text-lg font-semibold mb-1">
            {{ post.title }}
          </h2>
          <div class="text-xs text-muted">
            <strong>Author: {{ post.author?.first_name }} {{ post.author?.last_name }}</strong>
            <span class="mx-1">//</span>
            <span>Published: {{ post.published_at }}</span>
          </div>
        </NuxtLink>
      </UCard>
    </div>
  </div>
</template>
