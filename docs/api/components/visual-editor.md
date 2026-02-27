---
outline: deep
---

# DirectusVisualEditor

A wrapper component that marks content as editable by adding `data-directus` attributes. When your site is loaded inside the Directus admin iframe, these attributes enable inline editing via the `@directus/visual-editing` SDK.

The component only adds attributes when the visual editor detects it is inside a Directus iframe — normal visitors will not see any extra attributes in the DOM.

### Usage

```vue
<script setup>
const directus = useDirectus()

const { data: article } = await useAsyncData('article', () =>
  directus.request(readItem('articles', route.params.id)),
)
</script>

<template>
  <DirectusVisualEditor collection="articles" :item="article.id" fields="title" mode="drawer">
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
<DirectusVisualEditor collection="articles" :item="article.id">
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
<DirectusVisualEditor collection="articles" :item="article.id" fields="title">
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
  directus.request(readItem('articles', id)),
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
