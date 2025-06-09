<script setup lang="ts" generic="T extends keyof DirectusSchema">
import type { PrimaryKey } from '@directus/types'
import { computed } from '#imports'
import { setAttr } from '@directus/visual-editing'
import { useDirectusPreview } from '../composables/directus'
import { Slot } from '../utils'

type SingleDirectusCollection = DirectusSchema[T] extends Array<any> ? DirectusSchema[T][0] : DirectusSchema[T]
type FieldKey = keyof SingleDirectusCollection

const props = defineProps<{
  collection: T
  item: PrimaryKey
  fields?: FieldKey | FieldKey[]
  mode?: 'drawer' | 'modal' | 'popover'
}>()

const directusPreview = useDirectusPreview()

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
  if (!directusPreview.value) {
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
