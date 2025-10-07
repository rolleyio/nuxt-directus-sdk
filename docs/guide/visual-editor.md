# Visual Editor

The Visual Editor allows content editors to preview and edit content directly from your Nuxt frontend without needing to navigate to the Directus admin panel. This creates a seamless editing experience.

## Features

- Live preview mode with `?preview=true`
- Inline editing of content
- Edit modes: drawer, modal, or popover
- Automatic detection of editable fields
- Seamless integration with Directus collections

## Quick Start

### Enable Preview Mode

Add the preview query parameter to any page:

```
https://yourapp.com/blog/my-post?preview=true
```

This activates the visual editor for that page.

### Basic Usage

Wrap content you want to make editable with the `DirectusVisualEditor` component:

```vue
<script setup>
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
      fields="content"
    >
      <div v-html="article.content" />
    </DirectusVisualEditor>
  </article>
</template>
```

When visiting the page with `?preview=true`, content editors can click on the wrapped elements to edit them directly.

## Component Props

### `collection` (required)

The Directus collection name:

```vue
<DirectusVisualEditor collection="articles" :item="article.id">
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>
```

### `item` (required)

The item ID (primary key):

```vue
<DirectusVisualEditor collection="articles" :item="article.id">
  <!-- content -->
</DirectusVisualEditor>
```

### `fields` (optional)

Specify which field(s) to edit. Can be a string or array:

```vue
<!-- Single field -->
<DirectusVisualEditor
  collection="articles"
  :item="article.id"
  fields="title"
>
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>

<!-- Multiple fields -->
<DirectusVisualEditor
  collection="articles"
  :item="article.id"
  :fields="['title', 'subtitle']"
>
  <h1>{{ article.title }}</h1>
  <h2>{{ article.subtitle }}</h2>
</DirectusVisualEditor>
```

If omitted, all fields in the wrapped content can be edited.

### `mode` (optional)

Control how the editor opens:

```vue
<!-- Drawer mode (default) - slides in from the side -->
<DirectusVisualEditor mode="drawer" collection="articles" :item="id">
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>

<!-- Modal mode - opens in a centered modal -->
<DirectusVisualEditor mode="modal" collection="articles" :item="id">
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>

<!-- Popover mode - opens near the clicked element -->
<DirectusVisualEditor mode="popover" collection="articles" :item="id">
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>
```

## Preview Mode Detection

Check if preview mode is active:

```vue
<script setup>
const directusPreview = useDirectusPreview()
</script>

<template>
  <div>
    <div v-if="directusPreview" class="preview-banner">
      Preview Mode Active
    </div>

    <DirectusVisualEditor
      v-if="directusPreview"
      collection="articles"
      :item="article.id"
    >
      <h1>{{ article.title }}</h1>
    </DirectusVisualEditor>

    <h1 v-else>{{ article.title }}</h1>
  </div>
</template>
```

## Complete Example

### Blog Post Page

```vue
<script setup>
const route = useRoute()
const directus = useDirectus()
const directusPreview = useDirectusPreview()

// Load article
const { data: article } = await useAsyncData('article', () =>
  directus.request(readItem('articles', route.params.id, {
    fields: ['*', { author: ['*'] }]
  }))
)

// Enable preview mode with ?preview=true
if (route.query.preview === 'true') {
  directusPreview.value = true
}
</script>

<template>
  <article>
    <!-- Preview mode indicator -->
    <div v-if="directusPreview" class="preview-banner">
      <p>Preview Mode - Click any content to edit</p>
    </div>

    <!-- Featured image -->
    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="featured_image"
      mode="drawer"
    >
      <img
        v-if="article.featured_image"
        :src="getDirectusFileUrl(article.featured_image, { width: 1200 })"
        :alt="article.title"
      />
    </DirectusVisualEditor>

    <!-- Title -->
    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="title"
    >
      <h1>{{ article.title }}</h1>
    </DirectusVisualEditor>

    <!-- Excerpt -->
    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="excerpt"
    >
      <p class="excerpt">{{ article.excerpt }}</p>
    </DirectusVisualEditor>

    <!-- Author (related collection) -->
    <DirectusVisualEditor
      collection="directus_users"
      :item="article.author.id"
      :fields="['first_name', 'last_name']"
    >
      <p class="author">
        By {{ article.author.first_name }} {{ article.author.last_name }}
      </p>
    </DirectusVisualEditor>

    <!-- Content -->
    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="content"
    >
      <div class="content" v-html="article.content" />
    </DirectusVisualEditor>
  </article>
</template>

<style scoped>
.preview-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #6644ff;
  color: white;
  padding: 0.5rem;
  text-align: center;
  z-index: 1000;
}

.excerpt {
  font-size: 1.2rem;
  color: #666;
}

.author {
  color: #999;
  font-style: italic;
}

.content {
  line-height: 1.6;
}
</style>
```

### Product Page

```vue
<script setup>
const route = useRoute()
const directus = useDirectus()
const directusPreview = useDirectusPreview()

const { data: product } = await useAsyncData('product', () =>
  directus.request(readItem('products', route.params.id, {
    fields: ['*', { images: ['*'] }]
  }))
)

if (route.query.preview === 'true') {
  directusPreview.value = true
}
</script>

<template>
  <div class="product">
    <!-- Product images -->
    <DirectusVisualEditor
      collection="products"
      :item="product.id"
      fields="images"
      mode="modal"
    >
      <div class="images">
        <img
          v-for="image in product.images"
          :key="image.id"
          :src="getDirectusFileUrl(image.directus_files_id, { width: 600 })"
          :alt="product.name"
        />
      </div>
    </DirectusVisualEditor>

    <div class="details">
      <!-- Product name -->
      <DirectusVisualEditor
        collection="products"
        :item="product.id"
        fields="name"
      >
        <h1>{{ product.name }}</h1>
      </DirectusVisualEditor>

      <!-- Price -->
      <DirectusVisualEditor
        collection="products"
        :item="product.id"
        fields="price"
      >
        <p class="price">${{ product.price }}</p>
      </DirectusVisualEditor>

      <!-- Description -->
      <DirectusVisualEditor
        collection="products"
        :item="product.id"
        fields="description"
      >
        <div class="description" v-html="product.description" />
      </DirectusVisualEditor>

      <!-- Features -->
      <DirectusVisualEditor
        collection="products"
        :item="product.id"
        fields="features"
      >
        <ul class="features">
          <li v-for="feature in product.features" :key="feature">
            {{ feature }}
          </li>
        </ul>
      </DirectusVisualEditor>
    </div>
  </div>
</template>
```

## Preview Links

Create preview links for editors:

```vue
<script setup>
const props = defineProps({
  article: Object,
})

const previewUrl = computed(() => {
  const url = new URL(window.location.origin)
  url.pathname = `/blog/${props.article.slug}`
  url.searchParams.set('preview', 'true')
  return url.href
})

function copyPreviewLink() {
  navigator.clipboard.writeText(previewUrl.value)
  // Show success message
}
</script>

<template>
  <div>
    <button @click="copyPreviewLink">
      Copy Preview Link
    </button>

    <a :href="previewUrl" target="_blank">
      Open Preview
    </a>
  </div>
</template>
```

## Configuration

### Disable Visual Editor

If you want to disable the visual editor globally:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  directus: {
    visualEditor: false,
  },
})
```

### Custom Preview Parameter

You can use a different query parameter:

```vue
<script setup>
const route = useRoute()
const directusPreview = useDirectusPreview()

// Use ?edit=1 instead of ?preview=true
if (route.query.edit === '1') {
  directusPreview.value = true
}
</script>
```

## Advanced Usage

### Conditional Editing

Only enable editing for specific users:

```vue
<script setup>
const { user, loggedIn } = useDirectusAuth()
const directusPreview = useDirectusPreview()
const route = useRoute()

// Only enable preview for admins
if (route.query.preview === 'true' && loggedIn.value && user.value.role?.name === 'Admin') {
  directusPreview.value = true
}
</script>
```

### Nested Collections

Edit related items:

```vue
<template>
  <article>
    <!-- Edit the article -->
    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="title"
    >
      <h1>{{ article.title }}</h1>
    </DirectusVisualEditor>

    <!-- Edit the related category -->
    <DirectusVisualEditor
      collection="categories"
      :item="article.category.id"
      fields="name"
    >
      <span class="category">{{ article.category.name }}</span>
    </DirectusVisualEditor>

    <!-- Edit multiple related tags -->
    <div class="tags">
      <DirectusVisualEditor
        v-for="tag in article.tags"
        :key="tag.id"
        collection="tags"
        :item="tag.tags_id.id"
        fields="name"
      >
        <span class="tag">{{ tag.tags_id.name }}</span>
      </DirectusVisualEditor>
    </div>
  </article>
</template>
```

### Layout Builder

Create editable page layouts:

```vue
<script setup>
const directus = useDirectus()
const route = useRoute()

const { data: page } = await useAsyncData('page', () =>
  directus.request(readItem('pages', route.params.id, {
    fields: ['*', { blocks: ['*'] }]
  }))
)
</script>

<template>
  <div class="page">
    <!-- Edit page title -->
    <DirectusVisualEditor
      collection="pages"
      :item="page.id"
      fields="title"
    >
      <h1>{{ page.title }}</h1>
    </DirectusVisualEditor>

    <!-- Edit each block -->
    <div
      v-for="block in page.blocks"
      :key="block.id"
      class="block"
    >
      <DirectusVisualEditor
        collection="blocks"
        :item="block.id"
        mode="drawer"
      >
        <component :is="getBlockComponent(block.type)" :data="block" />
      </DirectusVisualEditor>
    </div>
  </div>
</template>
```

## Troubleshooting

### Editor Not Appearing

1. Make sure `?preview=true` is in the URL
2. Check that `directusPreview.value = true` is set
3. Verify `visualEditor: true` in module config (default)
4. Ensure you're logged into Directus in the same browser

### Changes Not Saving

1. Check that you have edit permissions for the collection
2. Verify the `item` ID is correct
3. Make sure field names match your Directus schema
4. Check browser console for errors

### CORS Issues

The visual editor connects to your Directus instance. Ensure CORS is configured:

```env
# Directus .env
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
```

## API Reference

### `DirectusVisualEditor`

A component that wraps editable content.

**Props:**
```typescript
interface DirectusVisualEditorProps {
  collection: string                    // Directus collection name
  item: string | number                 // Item ID (primary key)
  fields?: string | string[]            // Field(s) to edit
  mode?: 'drawer' | 'modal' | 'popover' // Editor display mode
}
```

### `useDirectusPreview()`

Returns a ref for controlling preview mode.

**Returns:** `Ref<boolean>`

**Example:**
```typescript
const directusPreview = useDirectusPreview()

// Enable preview mode
directusPreview.value = true

// Disable preview mode
directusPreview.value = false

// Check if preview mode is active
if (directusPreview.value) {
  console.log('Preview mode is active')
}
```

## See Also

- [Directus Visual Editing Documentation](https://docs.directus.io/guides/headless-cms/live-preview-nuxt.html)
- [Getting Started](/guide/getting-started)
- [Configuration Reference](/api/configuration)
