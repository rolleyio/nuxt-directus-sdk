# Visual Editor

The Visual Editor allows content editors to preview and edit content directly from your Nuxt frontend when embedded inside the Directus admin panel. It automatically detects when your site is loaded inside a Directus iframe and enables inline editing.

## Features

- Automatic iframe detection — no query parameters needed
- Inline editing with drawer, modal, or popover modes
- Edit and Add buttons for quick content management
- Debug mode via `?debug` for troubleshooting deployments
- Automatic data refresh on save (no full page reload)
- MutationObserver-based detection for reliable SSR hydration

## How It Works

When `visualEditor: true` is set in your config (the default), the module:

1. **Detects the iframe** — On the client, the plugin checks `window.parent !== window` to determine if your site is embedded inside Directus
2. **Renders attributes** — `DirectusVisualEditor` components add `data-directus` attributes to mark editable elements (only when inside the iframe)
3. **Applies the SDK** — A client-only plugin uses a MutationObserver to detect `data-directus` attributes in the DOM, then calls `apply()` from `@directus/visual-editing` to establish the connection with Directus
4. **Refreshes on save** — When content is saved in Directus, `refreshNuxtData()` is called to update the page without a full reload

## Quick Start

### 1. Enable Visual Editor (default)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  directus: {
    url: 'https://your-directus-instance.com',
    visualEditor: true, // This is the default
  },
})
```

### 2. Wrap Editable Content

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

### 3. Configure Directus Live Preview

In your Directus admin panel, configure Live Preview to point to your Nuxt app URL. When content editors open the preview, your site loads inside the Directus iframe and editing is automatically enabled.

No `?preview=true` query parameter is needed — the visual editor activates automatically when it detects the iframe.

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

## Edit Button

The `DirectusEditButton` component renders a floating button that opens the Directus editor for a specific item. It only appears when inside the Directus iframe.

```vue
<template>
  <article>
    <h1>{{ article.title }}</h1>
    <div v-html="article.content" />

    <!-- Floating edit button - appears only inside Directus -->
    <DirectusEditButton
      collection="articles"
      :item="article.id"
    />
  </article>
</template>
```

### Edit Button Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `collection` | `string` | Yes | — | The Directus collection name |
| `item` | `string \| number` | Yes | — | The item ID (primary key) |
| `mode` | `'drawer' \| 'modal' \| 'popover'` | No | `'drawer'` | How the editor opens |

The button renders with default styling (purple, fixed bottom-right) and a pencil icon. You can customize it via the default slot:

```vue
<DirectusEditButton collection="articles" :item="article.id">
  <span>Custom Edit Label</span>
</DirectusEditButton>
```

## Add Button

The `DirectusAddButton` component renders an inline button for adding items to a repeater/relationship field. It only appears when inside the Directus iframe.

```vue
<template>
  <div>
    <div v-for="block in page.blocks" :key="block.id">
      <component :is="getBlockComponent(block.type)" :data="block" />
    </div>

    <!-- Add button for the blocks repeater field -->
    <DirectusAddButton
      collection="pages"
      :item="page.id"
      field="blocks"
    />
  </div>
</template>
```

### Add Button Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `collection` | `string` | Yes | — | The parent collection containing the repeater field |
| `item` | `string \| number` | Yes | — | The parent item ID |
| `field` | `string` | Yes | — | The field name of the repeater (e.g., `'blocks'`) |

The button renders as a full-width dashed border area with a plus icon. You can customize it via the default slot:

```vue
<DirectusAddButton collection="pages" :item="page.id" field="blocks">
  <span>+ Add new block</span>
</DirectusAddButton>
```

## Visual Editor State

### `useDirectusVisualEditor()`

Check if the visual editor is active (i.e., your site is inside the Directus iframe):

```vue
<script setup>
const directusVisualEditor = useDirectusVisualEditor()
</script>

<template>
  <div>
    <div v-if="directusVisualEditor" class="editor-banner">
      Editing Mode
    </div>

    <h1>{{ article.title }}</h1>
  </div>
</template>
```

This composable is set automatically by the plugin — you don't need to set it manually.

### Preview Mode

Preview mode (`useDirectusPreview()`) and visual editor mode (`useDirectusVisualEditor()`) are separate concepts:

- **Preview mode** — Activated via `?preview=true` query parameter. Use this to show draft/unpublished content with a preview token.
- **Visual editor mode** — Activated automatically when inside a Directus iframe. Enables inline editing.

They can be used together:

```vue
<script setup>
const directusPreview = useDirectusPreview()
const directusVisualEditor = useDirectusVisualEditor()
</script>

<template>
  <div>
    <!-- Show preview banner when viewing draft content -->
    <div v-if="directusPreview" class="preview-banner">
      Preview Mode
    </div>

    <!-- Editable content - attributes only added inside Directus iframe -->
    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="title"
    >
      <h1>{{ article.title }}</h1>
    </DirectusVisualEditor>
  </div>
</template>
```

## Complete Example

### Blog Post Page

```vue
<script setup>
const route = useRoute()
const directus = useDirectus()

const { data: article } = await useAsyncData('article', () =>
  directus.request(readItem('articles', route.params.id, {
    fields: ['*', { author: ['*'] }]
  }))
)
</script>

<template>
  <article>
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

    <!-- Edit button -->
    <DirectusEditButton collection="articles" :item="article.id" />
  </article>
</template>
```

### Page with Dynamic Blocks

```vue
<script setup>
const route = useRoute()
const directus = useDirectus()

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

    <!-- Add new block button -->
    <DirectusAddButton
      collection="pages"
      :item="page.id"
      field="blocks"
    />

    <!-- Edit page button -->
    <DirectusEditButton collection="pages" :item="page.id" />
  </div>
</template>
```

## Debug Mode

Add `?debug` to any page URL to enable debug logging for the visual editor:

```
https://yourapp.com/blog/my-post?debug
```

This outputs detailed logs to the browser console:

```
[Directus Plugin] Visual editor config enabled: true
[Directus Plugin] Is in iframe: true
[Directus Visual Editor] Config visualEditor: true
[Directus Visual Editor] Is in iframe: true
[Directus Visual Editor] Directus URL: https://your-directus.com
[Directus Visual Editor] MutationObserver started, waiting for [data-directus] elements
[Directus Visual Editor] MutationObserver: found 12 [data-directus] elements
[Directus Visual Editor] Calling apply()...
[Directus Visual Editor] apply() result: true
```

Debug mode is useful for diagnosing:
- **CSP issues** — Content-Security-Policy blocking `frame-ancestors` or `postMessage`
- **URL mismatches** — `directusUrl` in your config not matching the actual Directus admin origin
- **Iframe detection** — Confirming your site correctly detects the Directus iframe
- **Element detection** — Verifying `data-directus` attributes are being rendered

## Configuration

### Disable Visual Editor

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  directus: {
    visualEditor: false,
  },
})
```

When disabled, `DirectusVisualEditor` renders as a pass-through wrapper with no `data-directus` attributes, and the visual editor plugin is not loaded.

## Advanced Usage

### Nested Collections

Edit related items from different collections:

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

### Conditional Content Based on Editor State

```vue
<script setup>
const directusVisualEditor = useDirectusVisualEditor()
</script>

<template>
  <div>
    <!-- Show extra editing tools only inside Directus -->
    <div v-if="directusVisualEditor" class="editor-toolbar">
      <DirectusEditButton collection="articles" :item="article.id" />
    </div>

    <DirectusVisualEditor
      collection="articles"
      :item="article.id"
      fields="title"
    >
      <h1>{{ article.title }}</h1>
    </DirectusVisualEditor>
  </div>
</template>
```

## Troubleshooting

### Editor Not Connecting

1. Check debug output with `?debug` in the URL
2. Verify `visualEditor: true` in module config (default)
3. Ensure your Directus URL config matches the actual Directus admin URL origin
4. Check that CORS is configured correctly on your Directus instance

### `apply() result: false`

The `apply()` function uses `postMessage` to handshake with the Directus parent frame. If it returns `false`:

1. **URL mismatch** — The `url` in your nuxt.config must match the exact origin of the Directus admin panel. For example, if your Directus admin is at `https://api.example.com` but your config points to `https://directus.fly.dev`, the handshake will fail
2. **CORS issues** — Ensure your Directus instance allows your Nuxt app origin
3. **CSP restrictions** — Check that `Content-Security-Policy` allows `frame-ancestors` from your Directus origin

### CORS Configuration

The visual editor connects to your Directus instance via `postMessage`. Ensure CORS is configured:

```dotenv
# Directus .env
CORS_ENABLED=true
CORS_ORIGIN=https://your-nuxt-app.com
CORS_CREDENTIALS=true
```

### Attributes Not Appearing

If `data-directus` attributes are not being added to elements:

1. Confirm your site is loaded inside the Directus iframe (check `?debug` output)
2. Verify `visualEditor: true` in your config
3. The attributes are only rendered when the visual editor detects an iframe — they are hidden from normal visitors

## API Reference

### `DirectusVisualEditor`

A component that wraps editable content with `data-directus` attributes.

**Props:**
```typescript
interface DirectusVisualEditorProps {
  collection: string                    // Directus collection name
  item: string | number                 // Item ID (primary key)
  fields?: string | string[]            // Field(s) to edit
  mode?: 'drawer' | 'modal' | 'popover' // Editor display mode
}
```

### `DirectusEditButton`

A floating button that triggers the Directus editor for a specific item.

**Props:**
```typescript
interface DirectusEditButtonProps {
  collection: string                    // Directus collection name
  item: string | number                 // Item ID (primary key)
  mode?: 'drawer' | 'modal' | 'popover' // Editor display mode
}
```

### `DirectusAddButton`

An inline button that opens the editor for a repeater/relationship field.

**Props:**
```typescript
interface DirectusAddButtonProps {
  collection: string                    // Parent collection name
  item: string | number                 // Parent item ID
  field: string                         // Repeater field name
}
```

### `useDirectusVisualEditor()`

Returns a ref indicating whether the visual editor is active.

**Returns:** `Ref<boolean>`

```typescript
const directusVisualEditor = useDirectusVisualEditor()

if (directusVisualEditor.value) {
  // Inside Directus iframe — editing is enabled
}
```

### `useDirectusPreview()`

Returns a ref for controlling preview mode.

**Returns:** `Ref<boolean>`

```typescript
const directusPreview = useDirectusPreview()

// Enable preview mode
directusPreview.value = true
```

## See Also

- [Directus Visual Editing Documentation](https://docs.directus.io/guides/headless-cms/live-preview-nuxt.html)
- [Getting Started](/guide/getting-started)
- [Configuration Reference](/api/configuration/)
- [Components Reference](/api/components/)
