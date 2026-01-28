<script setup lang="ts">
	import { readItems, useAsyncData, useDirectus } from '#imports'

	const directus = useDirectus()

	const { data: posts } = await useAsyncData('posts', () => {
		return directus.request(
			readItems('posts', {
				fields: [
					'id',
					'title',
					{ author: ['first_name', 'last_name'] },
					'slug',
					'published_at',
				],
				sort: '-published_at',
				filter: { status: { _eq: 'published' } },
			})
		)
	})
</script>
<template>
	<div>
		<h1>View Blog Posts</h1>
		<div
			v-for="post in posts"
			:key="post.id">
			<NuxtLink :href="`/blog/${post.slug}`">
				<h2>{{ post.title }}</h2>
				<span>
					<small>
						{{ post.author?.first_name }} {{ post.author?.last_name }}</small
					>
					- {{ post.published_at }}
				</span>
			</NuxtLink>
		</div>
	</div>
</template>
