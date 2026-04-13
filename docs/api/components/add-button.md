---
outline: deep
---

# DirectusAddButton

An inline button for adding items to a repeater or relationship field. Only visible when inside the Directus admin iframe.

<!-- eslint-disable-next-line markdown/heading-increment -->
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
