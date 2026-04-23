<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({
  middleware: ['auth'],
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-2">
      Dashboard Vue Page
    </h1>
    <p class="text-muted mb-2">
      This page is where you will be routed once you successfully login.
    </p>
    <p class="text-muted">
      If you attempt to access this page without being logged in, you are directed to login first.
    </p>
  </div>
</template>
