<script lang="ts" setup>
	import { useDirectusAuth } from '#imports'

	const { user, loggedIn } = useDirectusAuth()
</script>

<template>
	<div>
		<header>
			<NuxtLink href="/">Home</NuxtLink>
			<NuxtLink href="/blog">Blog</NuxtLink>
			<NuxtLink
				v-if="!loggedIn"
				href="/auth/login"
				>Login</NuxtLink
			>
			<NuxtLink
				v-else
				href="/auth/logout"
				>Logout of {{ user }}</NuxtLink
			>
		</header>
		<NuxtPage />
	</div>
</template>
<style scoped>
	header {
		display: flex;
		gap: 20px;
		margin: 20px;
	}
</style>
