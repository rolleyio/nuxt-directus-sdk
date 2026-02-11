# Components Reference

API reference for all components provided by nuxt-directus-sdk.

## DirectusVisualEditor

A wrapper component that marks content as editable by adding `data-directus` attributes. When your site is loaded inside the Directus admin iframe, these attributes enable inline editing via the `@directus/visual-editing` SDK.

The component only adds attributes when the visual editor detects it is inside a Directus iframe — normal visitors will not see any extra attributes in the DOM.

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

#### `mode` (optional)

- **Type:** `'drawer' | 'modal' | 'popover'`
- **Required:** No
- **Default:** `'drawer'`

Controls how the editor interface is displayed when content is clicked.

- **Drawer** — Slides in from the side of the screen. Best for most use cases.
- **Modal** — Opens in a centered modal dialog. Good for focused editing.
- **Popover** — Opens near the clicked element. Best for inline quick edits.

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

### Behavior

#### Attribute Rendering

The component renders `data-directus` attributes on its wrapper element **only** when the visual editor detects it is inside a Directus iframe. For normal visitors, the component is a simple pass-through wrapper with no extra attributes.

#### Data Synchronization

When content is saved in the Directus editor, `refreshNuxtData()` is called automatically. This means reactive data sources (`useAsyncData`, `useFetch`) will update without a full page reload.

**Best practice:** Use reactive data sources for content that may be edited:

```vue
<script setup>
// Good - reactive data that updates on save
const { data: article } = await useAsyncData('article', () =>
  directus.request(readItem('articles', id))
)

// Avoid - static data won't update after edits
const article = await directus.request(readItem('articles', id))
</script>
```

### TypeScript Support

The component is fully typed with generics:

```vue
<script setup lang="ts">
// TypeScript will enforce correct collection names and field names
<DirectusVisualEditor
  collection="articles"  // Must match a key in DirectusSchema
  :item="article.id"
  fields="title"         // Must match a field in the collection
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

Control the visual editor globally in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  directus: {
    visualEditor: true, // Enable/disable visual editor (default: true)
  },
})
```

When disabled, the component becomes a simple pass-through wrapper with no functionality.

---

## DirectusEditButton

A floating button that triggers the Directus editor for a specific item. Only visible when inside the Directus admin iframe.

### Usage

```vue
<template>
  <article>
    <h1>{{ article.title }}</h1>
    <div v-html="article.content" />

    <DirectusEditButton
      collection="articles"
      :item="article.id"
    />
  </article>
</template>
```

### Props

#### `collection` (required)

- **Type:** `string`
- **Required:** Yes

The Directus collection name.

#### `item` (required)

- **Type:** `string | number`
- **Required:** Yes

The item ID (primary key) to edit.

#### `mode` (optional)

- **Type:** `'drawer' | 'modal' | 'popover'`
- **Required:** No
- **Default:** `'drawer'`

How the Directus editor opens when the button is clicked.

### Slots

#### Default Slot

Customize the button content. By default, renders a pencil icon with "Edit Page" text.

```vue
<!-- Default appearance -->
<DirectusEditButton collection="articles" :item="article.id" />

<!-- Custom content -->
<DirectusEditButton collection="articles" :item="article.id">
  <MyIcon name="edit" />
  <span>Edit Article</span>
</DirectusEditButton>
```

### Behavior

- Renders as a fixed-position button in the bottom-right corner
- Only visible when `visualEditor: true` in config **and** the site is inside a Directus iframe
- Sends a `postMessage` to the parent Directus frame to open the editor
- Default styling: purple background with hover effects and max z-index

### Styling

The button has scoped default styles. Override using the default slot for custom content, or target the `.directus-edit-button` class:

```css
.directus-edit-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #6644ff;
  color: white;
  border-radius: 8px;
  z-index: 2147483647;
}
```

---

## DirectusAddButton

An inline button for adding items to a repeater or relationship field. Only visible when inside the Directus admin iframe.

### Usage

```vue
<template>
  <div>
    <div v-for="block in page.blocks" :key="block.id">
      <component :is="getBlockComponent(block.type)" :data="block" />
    </div>

    <DirectusAddButton
      collection="pages"
      :item="page.id"
      field="blocks"
    />
  </div>
</template>
```

### Props

#### `collection` (required)

- **Type:** `string`
- **Required:** Yes

The parent collection that contains the repeater field.

#### `item` (required)

- **Type:** `string | number`
- **Required:** Yes

The parent item ID.

#### `field` (required)

- **Type:** `string`
- **Required:** Yes

The field name of the repeater on the parent item (e.g., `'blocks'`, `'images'`, `'sections'`).

### Slots

#### Default Slot

Customize the button content. By default, renders a plus icon.

```vue
<!-- Default appearance -->
<DirectusAddButton collection="pages" :item="page.id" field="blocks" />

<!-- Custom content -->
<DirectusAddButton collection="pages" :item="page.id" field="blocks">
  <span>+ Add new block</span>
</DirectusAddButton>
```

### Behavior

- Renders as a full-width inline button with a dashed border
- Only visible when `visualEditor: true` in config **and** the site is inside a Directus iframe
- Opens the parent item's editor focused on the specified repeater field
- Uses the `drawer` mode by default

### Styling

The button has scoped default styles. Override using the default slot for custom content, or target the `.directus-add-button` class:

```css
.directus-add-button {
  width: 100%;
  border: 2px dashed #6644ff;
  color: #6644ff;
  border-radius: 8px;
  opacity: 0.6;
}
```

---

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
- [Composables Reference](/api/composables)
- [Configuration Reference](/api/configuration)
- [Directus Visual Editing Documentation](https://docs.directus.io/guides/headless-cms/live-preview-nuxt.html)
