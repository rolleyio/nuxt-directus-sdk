<script setup lang="ts">
import {
  computed,
  readItems,
  useAsyncData,
  useDirectus,
  useRoute,
} from '#imports'

const route = useRoute()
const directus = useDirectus()

const slug = computed(() => route.params.slug)

const { data: blog } = await useAsyncData(
  `blog-${slug.value}`,
  () => {
    return directus.request(
      readItems('posts', {
        filter: { slug: { _eq: `${slug.value}` } },
        fields: [
          'id',
          'title',
          'image',
          'content',
          { author: ['id', 'first_name', 'last_name'] },
          'published_at',
        ],
      }),
    )
  },
  { transform: data => data[0] },
)
</script>

<template>
  <article v-if="blog" class="space-y-4">
    <DirectusVisualEditor
      collection="posts"
      :item="blog.id"
      fields="image"
      mode="drawer"
    >
      <NuxtImg
        v-if="blog.image"
        provider="directus"
        fit="cover"
        height="250"
        width="600"
        :src="blog.image"
        class="rounded-lg border border-default"
      />
    </DirectusVisualEditor>

    <DirectusVisualEditor
      collection="posts"
      :item="blog.id"
      fields="title"
      mode="popover"
    >
      <h1 class="text-3xl font-bold">
        {{ blog.title }}
      </h1>
    </DirectusVisualEditor>

    <DirectusVisualEditor
      v-if="blog.author && typeof blog.author === 'object'"
      collection="directus_users"
      :item="(blog.author as any).id"
      :fields="['first_name', 'last_name']"
      mode="modal"
    >
      <h2 class="text-base font-semibold text-muted">
        {{ (blog.author as any).first_name }} {{ (blog.author as any).last_name }}
      </h2>
    </DirectusVisualEditor>

    <small class="text-xs text-muted block">{{ blog.published_at }}</small>

    <DirectusVisualEditor
      collection="posts"
      :item="blog.id"
      fields="content"
    >
      <pre class="bg-elevated border border-default rounded p-4 text-sm whitespace-pre-wrap wrap-break-word">{{ blog.content }}</pre>
    </DirectusVisualEditor>

    <DirectusEditButton collection="posts" :item="blog.id" />
  </article>
</template>
