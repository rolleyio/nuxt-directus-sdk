<script setup lang="ts" generic="T extends keyof DirectusSchema">
import type { PrimaryKey } from '@directus/types'
import { computed, useRuntimeConfig } from '#imports'
import { useDirectusPreview } from '../composables/directus'

const props = defineProps<{
  collection: T
  item: PrimaryKey
  mode?: 'drawer' | 'modal' | 'popover'
}>()

const config = useRuntimeConfig()
const directusPreview = useDirectusPreview()

// Only show when in preview mode
const showButton = computed(() => directusPreview.value)

// Directly trigger the Directus visual editor by sending a postMessage
function triggerEdit() {
  const directusUrl = (config.public.directus as any).directusUrl || config.public.directus.url

  const editConfig = {
    collection: props.collection as string,
    item: props.item,
    mode: props.mode ?? 'drawer',
  }

  // Send edit message directly to Directus parent frame
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
    console.error('[DirectusEditButton] Error triggering edit:', error)
  }
}
</script>

<template>
  <button
    v-if="showButton"
    type="button"
    class="directus-edit-button"
    title="Edit in Directus"
    @click="triggerEdit"
  >
    <slot>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      <span>Edit Page</span>
    </slot>
  </button>
</template>

<style scoped>
.directus-edit-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #6644ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(102, 68, 255, 0.4);
  z-index: 2147483647; /* Maximum valid z-index to ensure it appears above all elements */
}

.directus-edit-button:hover {
  background: #5533dd;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 68, 255, 0.5);
}

.directus-edit-button:active {
  transform: translateY(0);
}
</style>
