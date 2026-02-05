<script setup lang="ts">
import type { PrimaryKey } from '@directus/types'
import { computed, useRuntimeConfig } from '#imports'
import { useDirectusPreview } from '../composables/directus'

const props = defineProps<{
  /** The parent collection that contains the repeater field */
  collection: string
  /** The parent item ID */
  item: PrimaryKey
  /** The field name of the repeater on the parent (e.g., 'blocks') */
  field: string
}>()

const config = useRuntimeConfig()
const directusPreview = useDirectusPreview()

// Only show when in preview mode
const showButton = computed(() => directusPreview.value)

// Open Directus admin to edit the parent item (which contains the repeater)
// This allows adding new items to the repeater field
function triggerAdd() {
  const directusUrl = (config.public.directus as any).directusUrl || config.public.directus.url

  // Open the parent item's edit page, focusing on the specific field
  // Using the visual editor to edit the parent item with the repeater field
  const editConfig = {
    collection: props.collection,
    item: props.item,
    fields: [props.field],
    mode: 'drawer' as const,
  }

  try {
    window.parent.postMessage({
      action: 'edit',
      data: {
        key: crypto.randomUUID(),
        editConfig,
        rect: { top: 0, left: 0, width: 0, height: 0 },
      },
    }, directusUrl)
  }
  catch (error) {
    console.error('[DirectusAddButton] Error triggering add:', error)
  }
}
</script>

<template>
  <button
    v-if="showButton"
    type="button"
    class="directus-add-button"
    title="Add new item"
    @click="triggerAdd"
  >
    <slot>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </slot>
  </button>
</template>

<style scoped>
.directus-add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
  margin: 8px 0;
  background: transparent;
  color: #6644ff;
  border: 2px dashed #6644ff;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  opacity: 0.6;
}

.directus-add-button:hover {
  background: rgba(102, 68, 255, 0.1);
  opacity: 1;
}

.directus-add-button:active {
  background: rgba(102, 68, 255, 0.2);
}
</style>
