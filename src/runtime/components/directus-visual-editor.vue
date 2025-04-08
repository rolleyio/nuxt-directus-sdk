<script setup lang="ts" generic="T extends keyof DirectusSchema">
import type { PrimaryKey } from '@directus/types'
import { setAttr } from '@directus/visual-editing'
import { isVisualEditorPage } from '../composables/preview'
import { Slot } from '../utils/slot'

type SingleDirectusCollection = DirectusSchema[T][0]
type FieldKey = keyof SingleDirectusCollection

const props = defineProps<{
  collection: T
  item: PrimaryKey
  fields?: FieldKey | FieldKey[]
  mode?: 'drawer' | 'modal' | 'popover'
}>()

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
  if (!isVisualEditorPage()) {
    return null
  }

  return {
    'data-directus': directusAttr.value,
  }
})
</script>

<template>
  <Slot v-bind="attributes">
    <slot />
  </Slot>
</template>
