# Components Reference

API reference for all components provided by nuxt-directus-sdk.

## DirectusVisualEditor

A wrapper component that enables live preview and inline editing of Directus content directly from your Nuxt frontend.

### Usage

```vue
<script setup>
const directus = useDirectus()

const { data: article } = await useAsyncData('article', () =>
  directus.request(readItem('articles', route.params.id))
)
</script>

<template>
  <DirectusVisualEditor
    collection="articles"
    :item="article.id"
    fields="title"
    mode="drawer"
  >
    <h1>{{ article.title }}</h1>
  </DirectusVisualEditor>
</template>
```

### Props

#### `collection` (required)

- **Type:** `string`
- **Required:** Yes

The name of the Directus collection containing the item to edit.

```vue
<DirectusVisualEditor collection="articles" :item="id">
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>
```

**Examples:**
```vue
<!-- System collections -->
<DirectusVisualEditor collection="directus_users" :item="user.id">
  <p>{{ user.first_name }}</p>
</DirectusVisualEditor>

<!-- Custom collections -->
<DirectusVisualEditor collection="products" :item="product.id">
  <h2>{{ product.name }}</h2>
</DirectusVisualEditor>

<DirectusVisualEditor collection="blog_posts" :item="post.id">
  <article v-html="post.content" />
</DirectusVisualEditor>
```

#### `item` (required)

- **Type:** `string | number`
- **Required:** Yes

The primary key (ID) of the item to edit.

```vue
<DirectusVisualEditor
  collection="articles"
  :item="article.id"
>
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>
```

**Examples:**
```vue
<!-- String UUID -->
<DirectusVisualEditor
  collection="articles"
  :item="'f8b5c4d7-8e2a-4f9b-9c1d-3e4f5a6b7c8d'"
>
  <h1>Title</h1>
</DirectusVisualEditor>

<!-- Numeric ID -->
<DirectusVisualEditor
  collection="categories"
  :item="42"
>
  <span>{{ category.name }}</span>
</DirectusVisualEditor>

<!-- From object -->
<DirectusVisualEditor
  collection="products"
  :item="product.id"
>
  <div>{{ product.name }}</div>
</DirectusVisualEditor>
```

#### `fields` (optional)

- **Type:** `string | string[]`
- **Required:** No
- **Default:** All fields in the wrapped content

Specify which field(s) should be editable. Can be a single field name or an array of field names.

**Single field:**
```vue
<DirectusVisualEditor
  collection="articles"
  :item="article.id"
  fields="title"
>
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>
```

**Multiple fields:**
```vue
<DirectusVisualEditor
  collection="articles"
  :item="article.id"
  :fields="['title', 'subtitle', 'excerpt']"
>
  <h1>{{ article.title }}</h1>
  <h2>{{ article.subtitle }}</h2>
  <p>{{ article.excerpt }}</p>
</DirectusVisualEditor>
```

**All fields (default):**
```vue
<DirectusVisualEditor
  collection="articles"
  :item="article.id"
>
  <!-- All fields in this content are editable -->
  <h1>{{ article.title }}</h1>
  <p>{{ article.content }}</p>
  <span>{{ article.author }}</span>
</DirectusVisualEditor>
```

#### `mode` (optional)

- **Type:** `'drawer' | 'modal' | 'popover'`
- **Required:** No
- **Default:** `'drawer'`

Controls how the editor interface is displayed when content is clicked.

**Drawer mode (default):**
```vue
<DirectusVisualEditor
  collection="articles"
  :item="article.id"
  mode="drawer"
>
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>
```

Slides in from the side of the screen. Best for most use cases.

**Modal mode:**
```vue
<DirectusVisualEditor
  collection="articles"
  :item="article.id"
  mode="modal"
>
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>
```

Opens in a centered modal dialog. Good for focused editing.

**Popover mode:**
```vue
<DirectusVisualEditor
  collection="articles"
  :item="article.id"
  mode="popover"
>
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>
```

Opens near the clicked element. Best for inline quick edits.

### Slots

#### Default Slot

The default slot contains the content that will be wrapped and made editable.

```vue
<DirectusVisualEditor collection="articles" :item="article.id">
  <!-- Content in the default slot becomes editable -->
  <article>
    <h1>{{ article.title }}</h1>
    <div v-html="article.content" />
  </article>
</DirectusVisualEditor>
```

**Requirements:**
- Must contain at least one element
- The slot content should display the data you want to edit
- Content should be reactive to data changes

### Complete Examples

#### Basic Article Editing

```vue
<script setup>
const route = useRoute()
const directus = useDirectus()
const directusPreview = useDirectusPreview()

const { data: article } = await useAsyncData('article', () =>
  directus.request(readItem('articles', route.params.id))
)

// Enable preview mode with ?preview=true
if (route.query.preview === 'true') {
  directusPreview.value = true
}
</script>

<template>
  <article>
    <!-- Title editing -->
    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="title"
    >
      <h1>{{ article.title }}</h1>
    </DirectusVisualEditor>

    <!-- Featured image editing -->
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

    <!-- Content editing -->
    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="content"
    >
      <div class="content" v-html="article.content" />
    </DirectusVisualEditor>
  </article>
</template>
```

#### Product Page

```vue
<script setup>
const { data: product } = await useAsyncData('product', () =>
  directus.request(readItem('products', route.params.id, {
    fields: ['*', { images: ['*'], category: ['*'] }]
  }))
)
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
      <div class="gallery">
        <img
          v-for="image in product.images"
          :key="image.id"
          :src="getDirectusFileUrl(image.directus_files_id, { width: 600 })"
        />
      </div>
    </DirectusVisualEditor>

    <div class="details">
      <!-- Product name and price -->
      <DirectusVisualEditor
        collection="products"
        :item="product.id"
        :fields="['name', 'price']"
      >
        <h1>{{ product.name }}</h1>
        <p class="price">${{ product.price }}</p>
      </DirectusVisualEditor>

      <!-- Category (related collection) -->
      <DirectusVisualEditor
        collection="categories"
        :item="product.category.id"
        fields="name"
      >
        <span class="category">{{ product.category.name }}</span>
      </DirectusVisualEditor>

      <!-- Description -->
      <DirectusVisualEditor
        collection="products"
        :item="product.id"
        fields="description"
      >
        <div v-html="product.description" />
      </DirectusVisualEditor>
    </div>
  </div>
</template>
```

#### Nested Collections

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

    <!-- Edit the related author -->
    <DirectusVisualEditor
      collection="directus_users"
      :item="article.author.id"
      :fields="['first_name', 'last_name']"
    >
      <p class="author">
        By {{ article.author.first_name }} {{ article.author.last_name }}
      </p>
    </DirectusVisualEditor>

    <!-- Edit multiple related tags -->
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

#### Conditional Rendering

```vue
<script setup>
const directusPreview = useDirectusPreview()
</script>

<template>
  <div>
    <!-- Only show visual editor in preview mode -->
    <DirectusVisualEditor
      v-if="directusPreview"
      collection="articles"
      :item="article.id"
      fields="title"
    >
      <h1>{{ article.title }}</h1>
    </DirectusVisualEditor>

    <!-- Regular rendering when not in preview mode -->
    <h1 v-else>{{ article.title }}</h1>
  </div>
</template>
```

#### Layout Builder

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
    <!-- Page title -->
    <DirectusVisualEditor
      collection="pages"
      :item="page.id"
      fields="title"
    >
      <h1>{{ page.title }}</h1>
    </DirectusVisualEditor>

    <!-- Dynamic blocks -->
    <DirectusVisualEditor
      v-for="block in page.blocks"
      :key="block.id"
      collection="blocks"
      :item="block.id"
      mode="drawer"
    >
      <component :is="getBlockComponent(block.type)" :data="block" />
    </DirectusVisualEditor>
  </div>
</template>
```

### Behavior

#### Preview Mode Activation

The component only becomes interactive when preview mode is enabled:

```vue
<script setup>
const route = useRoute()
const directusPreview = useDirectusPreview()

// Enable preview mode
if (route.query.preview === 'true') {
  directusPreview.value = true
}
</script>
```

**Preview mode can be enabled by:**
1. Adding `?preview=true` to the URL
2. Setting `directusPreview.value = true` programmatically

**When preview mode is disabled:**
- The component renders as a simple wrapper
- No editing interface is shown
- No extra attributes are added to the DOM

**When preview mode is enabled:**
- Content becomes clickable
- Clicking opens the Directus editor
- Changes are saved in real-time
- Visual indicators show editable areas (on hover)

#### Editor Connection

The component connects to your Directus instance when mounted:

1. Loads the Directus Visual Editing SDK
2. Establishes connection to Directus
3. Enables editing on wrapped elements
4. Cleans up on unmount

**Requirements:**
- User must be logged into Directus in the same browser
- Directus URL must be accessible
- CORS must be configured correctly

#### Data Synchronization

Changes made in the editor are:
1. Saved immediately to Directus
2. Reflected in the preview (if using reactive data)
3. Visible to content editors in real-time

**Best practice:** Use reactive data sources (refs, computed) for content that may be edited:

```vue
<script setup>
// ✅ Good - reactive data
const { data: article } = await useAsyncData('article', () =>
  directus.request(readItem('articles', id))
)

// ❌ Avoid - static data won't update after edits
const article = await directus.request(readItem('articles', id))
</script>
```

### TypeScript Support

The component is fully typed with generics:

```vue
<script setup lang="ts">
// Type-safe collection and item
const article = ref<DirectusSchema['articles']>()

// TypeScript will enforce correct collection names
<DirectusVisualEditor
  collection="articles"  // ✅ Valid collection
  :item="article.id"
>
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>

<DirectusVisualEditor
  collection="invalid"  // ❌ TypeScript error if collection doesn't exist
  :item="article.id"
>
  <h1>{{ article.title }}</h1>
</DirectusVisualEditor>
</script>
```

**Props type definition:**

```typescript
interface DirectusVisualEditorProps<T extends keyof DirectusSchema> {
  collection: T
  item: string | number
  fields?: keyof DirectusSchema[T] | Array<keyof DirectusSchema[T]>
  mode?: 'drawer' | 'modal' | 'popover'
}
```

### Configuration

#### Global Configuration

Control visual editor globally in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  directus: {
    visualEditor: true, // Enable/disable visual editor
  },
})
```

When disabled, the component becomes a simple pass-through wrapper with no functionality.

#### Per-Component Configuration

Control behavior per component using props:

```vue
<!-- Use drawer for large content -->
<DirectusVisualEditor mode="drawer" collection="articles" :item="id">
  <article v-html="article.content" />
</DirectusVisualEditor>

<!-- Use popover for quick edits -->
<DirectusVisualEditor mode="popover" collection="tags" :item="tag.id">
  <span class="tag">{{ tag.name }}</span>
</DirectusVisualEditor>

<!-- Use modal for focused editing -->
<DirectusVisualEditor mode="modal" collection="products" :item="id">
  <div class="product-form">...</div>
</DirectusVisualEditor>
```

### Troubleshooting

#### Editor Not Appearing

**Possible causes:**
1. Preview mode not enabled
2. Visual editor disabled in config
3. Not logged into Directus
4. CORS issues

**Solutions:**
```vue
<!-- 1. Ensure preview mode is enabled -->
<script setup>
const directusPreview = useDirectusPreview()
if (route.query.preview === 'true') {
  directusPreview.value = true
}
</script>

<!-- 2. Check config -->
// nuxt.config.ts
export default defineNuxtConfig({
  directus: {
    visualEditor: true, // Must be true
  },
})

<!-- 3. Log into Directus in same browser -->

<!-- 4. Check CORS in Directus .env -->
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
```

#### Changes Not Saving

**Possible causes:**
1. Incorrect item ID
2. Missing edit permissions
3. Invalid field names

**Solutions:**
```vue
<!-- 1. Verify item ID is correct -->
<DirectusVisualEditor
  collection="articles"
  :item="article.id"  <!-- Check this matches database -->
>

<!-- 2. Check Directus permissions for your user role -->

<!-- 3. Ensure field names match your schema exactly -->
<DirectusVisualEditor
  fields="title"  <!-- Must match exact field name in Directus -->
>
```

#### TypeScript Errors

**Issue:** Collection or field names showing errors

**Solution:** Regenerate types:
```bash
# Delete .nuxt directory
rm -rf .nuxt

# Restart dev server
npm run dev
```

Ensure `DIRECTUS_ADMIN_TOKEN` is set for type generation.

## See Also

- [Visual Editor Guide](/guide/visual-editor)
- [Composables Reference](/api/composables)
- [Configuration Reference](/api/configuration)
- [Directus Visual Editing Documentation](https://docs.directus.io/guides/headless-cms/live-preview-nuxt.html)
