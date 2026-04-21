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
  <div v-if="blog">
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
        height="200"
        width="800"
        :src="blog.image"
      />
    </DirectusVisualEditor>

    <DirectusVisualEditor
      collection="posts"
      :item="blog.id"
      fields="title"
      mode="popover"
    >
      <h1>{{ blog.title }}</h1>
    </DirectusVisualEditor>

    <DirectusVisualEditor
      v-if="blog.author && typeof blog.author === 'object'"
      collection="directus_users"
      :item="(blog.author as any).id"
      :fields="['first_name', 'last_name']"
      mode="modal"
    >
      <h2>{{ (blog.author as any).first_name }} {{ (blog.author as any).last_name }}</h2>
    </DirectusVisualEditor>

    <small>{{ blog.published_at }}</small>

    <DirectusVisualEditor
      collection="posts"
      :item="blog.id"
      fields="content"
    >
      <pre>{{ blog.content }}</pre>
    </DirectusVisualEditor>

    <DirectusEditButton collection="posts" :item="blog.id" />
  </div>
</template>
