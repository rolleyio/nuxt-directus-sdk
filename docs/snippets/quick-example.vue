<script setup>
	const directus = useDirectus()
	const { data: posts, error } = await useAsyncData('posts', () =>
		directus.request(
			readItems('posts', {
				limit: 10,
				filter: {
					status: { _eq: 'published' },
				},
			})
		)
	)
</script>

<template>
	<div>
		<h1>Blog Posts</h1>
		<div v-if="posts">
			<p>Successfully connected to Directus!</p>
			<p>Item count: {{ posts.length }}</p>
		</div>
		<pre>{{ error }}</pre>
	</div>
	<div
		v-for="post in posts"
		:key="post.id">
		<h2>{{ post.title }}</h2>
	</div>
</template>
