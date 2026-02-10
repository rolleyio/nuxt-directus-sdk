<script setup lang="ts" generic="T extends keyof DirectusSchema">
import type { PrimaryKey } from '@directus/types'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useRuntimeConfig,
} from '#imports'
import { apply, setAttr } from '@directus/visual-editing'
import { useDirectusPreview, useDirectusVisualEditor } from '../composables/directus'
import { Slot } from '../utils'

type SingleDirectusCollection = DirectusSchema[T] extends Array<any>
  ? DirectusSchema[T][0]
  : DirectusSchema[T]
type FieldKey = keyof SingleDirectusCollection

const props = defineProps<{
  collection: T
  item: PrimaryKey
  fields?: FieldKey | FieldKey[]
  mode?: 'drawer' | 'modal' | 'popover'
}>()

const config = useRuntimeConfig()
const directusPreview = useDirectusPreview()
const directusVisualEditing = useDirectusVisualEditor()
const editorElement = ref<HTMLElement | null>(null)

const directusAttr = computed(() => {
  const data: Record<any, any> = {}

  Object.entries(props).forEach(([key, value]) => {
    if (value !== undefined) {
      data[key] = value
    }
  })

  return setAttr(data as any)
})

const attributes = computed(() => {
  if (!directusPreview.value && !directusVisualEditing.value) {
    return null
  }

  return {
    'data-directus': directusAttr.value,
  }
})

onMounted(async () => {
  if (
    !config.public.directus.visualEditor
    || !editorElement.value
    || import.meta.server
  ) {
    return
  }

  // Use the original Directus URL (not the proxy) for visual editor
  // The visual-editing library validates postMessage origins against this URL
  const directusUrl = (config.public.directus as any).directusUrl || config.public.directus.url

  try {
    const applied = await apply({ directusUrl })

    if (!applied) {
      return
    }

    // apply() succeeded = Directus confirmed the handshake = we're in the visual editor
    directusVisualEditing.value = true

    applied.enable()

    onBeforeUnmount(() => {
      applied.remove()
    })
  }
  catch (error) {
    console.error('[DirectusVisualEditor] Error:', error)
  }
})
</script>

<template>
  <Slot
    ref="editorElement"
    v-bind="attributes"
  >
    <slot />
  </Slot>
</template>
