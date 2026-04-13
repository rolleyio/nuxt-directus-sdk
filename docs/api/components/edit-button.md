---
outline: deep
---

# DirectusEditButton

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
