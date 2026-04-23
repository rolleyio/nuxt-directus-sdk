<script setup lang="ts">
withDefaults(defineProps<{
  source?: 'directus' | 'nuxt'
  title?: string
}>(), {
  source: 'directus',
})
</script>

<template>
  <UAlert
    :color="source === 'directus' ? 'primary' : 'success'"
    variant="subtle"
    :icon="source === 'directus' ? 'i-lucide-database' : 'i-logos-nuxt-icon'"
    :title="title ?? (source === 'directus' ? 'Directus Config Required' : 'nuxt.config.ts')"
    class="mb-4"
  >
    <template #description>
      <div class="text-sm [&_code]:bg-elevated [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
        <slot />
      </div>
    </template>
  </UAlert>
</template>
