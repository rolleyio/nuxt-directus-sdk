<script setup lang="ts" generic="T extends keyof DirectusSchema">
import type { PrimaryKey } from '@directus/types'
import { computed, useRoute } from '#imports'
import { apply, setAttr } from '@directus/visual-editing'
import { Slot } from '../utils'

type SingleDirectusCollection = DirectusSchema[T] extends Array<any> ? DirectusSchema[T][0] : DirectusSchema[T]
type FieldKey = keyof SingleDirectusCollection

const props = defineProps<{
  collection: T
  item: PrimaryKey
  fields?: FieldKey | FieldKey[]
  mode?: 'drawer' | 'modal' | 'popover'
}>()

const route = useRoute()
const config = useRuntimeConfig()

const element = ref()

const livePreview = computed(() => {
  return route.query['visual-editor'] === 'true' || route.query['visual-editor'] === '1'
})

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
  if (!livePreview.value) {
    return null
  }

  return {
    'data-directus': directusAttr.value,
  }
})

onMounted(async () => {
  await nextTick()

  if (!livePreview.value || import.meta.server || !element.value) {
    return
  }

  const applied = await apply({ directusUrl: config.public.directus.url })

  if (!applied) {
    return
  }

  applied.enable()

  onBeforeUnmount(applied.remove)
})
</script>

<template>
  <Slot ref="element" v-bind="attributes">
    <slot />
  </Slot>
</template>
