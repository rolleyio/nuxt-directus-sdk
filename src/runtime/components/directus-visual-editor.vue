<script setup lang="ts" generic="T extends keyof DirectusSchema">
import type { PrimaryKey } from '@directus/types'
import { computed } from '#imports'
import { setAttr } from '@directus/visual-editing'
import { useDirectusVisualEditor } from '../composables/directus'
import { Slot } from '../utils'

type SingleDirectusCollection = DirectusSchema[T] extends Array<infer U>
  ? U
  : DirectusSchema[T]
type FieldKey = keyof SingleDirectusCollection

const props = defineProps<{
  collection: T
  item: PrimaryKey
  fields?: FieldKey | FieldKey[]
  mode?: 'drawer' | 'modal' | 'popover'
}>()

const directusVisualEditor = useDirectusVisualEditor()

const directusAttr = computed(() => {
  if (!directusVisualEditor.value) {
    return undefined
  }

  const data: Record<string, unknown> = {}

  Object.entries(props).forEach(([key, value]) => {
    if (value !== undefined) {
      data[key] = value
    }
  })

  return setAttr(data as Parameters<typeof setAttr>[0])
})
</script>

<template>
  <Slot :data-directus="directusAttr">
    <slot />
  </Slot>
</template>
