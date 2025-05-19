<script lang="ts" setup>
import { useError } from '#app'
</script>

<template>
  {{ useError().value }}
</template>
