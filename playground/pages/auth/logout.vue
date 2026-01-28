<script setup lang="ts">
	import { onMounted, useDirectusAuth } from '#imports'

	onMounted(() => {
		useDirectusAuth().logout()
	})
</script>
<template></template>
