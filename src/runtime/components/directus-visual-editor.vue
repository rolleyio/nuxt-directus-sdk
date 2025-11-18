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
import { useDirectusPreview } from '../composables/directus'
import { Slot } from '../utils'
import type { DirectusSchema } from '#build/types/directus'

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
  if (!directusPreview.value) {
    return null
  }

  return {
    'data-directus': directusAttr.value,
  }
})

onMounted(async () => {
  if (
    !config.public.directus.visualEditor ||
    !editorElement.value ||
    import.meta.server
  ) {
    return
  }

	const applied = await apply({ directusUrl: config.public.directus.url })

  if (!applied) {
    return
  }

  applied.enable()

  onBeforeUnmount(() => {
    applied.remove()
  })
})
</script>

<template>
  <Slot
    ref="editorElement"
    v-bind="attributes">
    <slot />
  </Slot>
</template>
