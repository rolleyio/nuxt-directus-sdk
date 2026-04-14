---
outline: [2,3]
---

# Components Reference

API reference for all components provided by nuxt-directus-sdk.

## DirectusVisualEditor
<!--@include: ./visual-editor.md{7,}-->

## DirectusEditButton
<!--@include: ./edit-button.md{7,}-->

## DirectusAddButton
<!--@include: ./add-button.md{7,}-->

## Complete Examples

### Article Editing

```vue
<script setup>
const route = useRoute()
const directus = useDirectus()

const { data: article } = await useAsyncData('article', () =>
  directus.request(readItem('articles', route.params.id))
)
</script>

<template>
  <article>
    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="title"
    >
      <h1>{{ article.title }}</h1>
    </DirectusVisualEditor>

    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="featured_image"
      mode="modal"
    >
      <img
        v-if="article.featured_image"
        :src="getDirectusFileUrl(article.featured_image, { width: 1200 })"
      />
    </DirectusVisualEditor>

    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="content"
    >
      <div class="content" v-html="article.content" />
    </DirectusVisualEditor>

    <DirectusEditButton collection="articles" :item="article.id" />
  </article>
</template>
```

### Page with Blocks

```vue
<script setup>
const { data: page } = await useAsyncData('page', () =>
  directus.request(readItem('pages', route.params.id, {
    fields: ['*', { blocks: ['*'] }]
  }))
)
</script>

<template>
  <div class="page">
    <DirectusVisualEditor
      collection="pages"
      :item="page.id"
      fields="title"
    >
      <h1>{{ page.title }}</h1>
    </DirectusVisualEditor>

    <DirectusVisualEditor
      v-for="block in page.blocks"
      :key="block.id"
      collection="blocks"
      :item="block.id"
      mode="drawer"
    >
      <component :is="getBlockComponent(block.type)" :data="block" />
    </DirectusVisualEditor>

    <DirectusAddButton
      collection="pages"
      :item="page.id"
      field="blocks"
    />

    <DirectusEditButton collection="pages" :item="page.id" />
  </div>
</template>
```

### Nested Collections

```vue
<template>
  <article>
    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="title"
    >
      <h1>{{ article.title }}</h1>
    </DirectusVisualEditor>

    <DirectusVisualEditor
      collection="directus_users"
      :item="article.author.id"
      :fields="['first_name', 'last_name']"
    >
      <p class="author">
        By {{ article.author.first_name }} {{ article.author.last_name }}
      </p>
    </DirectusVisualEditor>

    <div class="tags">
      <DirectusVisualEditor
        v-for="tag in article.tags"
        :key="tag.id"
        collection="tags"
        :item="tag.tags_id.id"
        fields="name"
        mode="popover"
      >
        <span class="tag">{{ tag.tags_id.name }}</span>
      </DirectusVisualEditor>
    </div>
  </article>
</template>
```

## See Also

- [Visual Editor Guide](/guide/visual-editor)
- [Composables Reference](/api/composables/)
- [Configuration Reference](/api/configuration/)
- [Directus Visual Editing Documentation](https://docs.directus.io/guides/headless-cms/live-preview-nuxt.html)
