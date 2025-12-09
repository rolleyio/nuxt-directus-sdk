<script setup lang="ts">
	import { definePageMeta } from '#imports'
	definePageMeta({
		middleware: ['auth'],
	})
</script>
<template>
	<div>
		<h1>Dashboard Vue Page</h1>
		<p>This page is where you will be routed once you successfully login.</p>
		<p>
			If you attempted to access this page without being logged in, you are
			directed to login first.
		</p>
	</div>
</template>
