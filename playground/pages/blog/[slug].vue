<script setup lang="ts">
	import {
		computed,
		readItems,
		useAsyncData,
		useDirectus,
		useRoute,
	} from '#imports'

	const route = useRoute()
	const directus = useDirectus()

	const slug = computed(() => {
		return route.params.slug
	})

	const { data: blog } = await useAsyncData(
		`blog-${slug.value}`,
		() => {
			return directus.request(
				readItems('posts', {
					filter: { slug: { _eq: `${slug.value}` } },
					fields: [
						'title',
						'image',
						'title',
						'content',
						{ author: ['first_name', 'last_name'] },
						'published_at',
					],
				})
			)
		},
		{ transform: (data) => data[0] }
	)
</script>
<template>
	<div v-if="blog">
		<h1>
			{{ blog.title }}
		</h1>
		<NuxtImg
			v-if="blog.image"
			provider="directus"
			fit="cover"
			height="200"
			width="200"
			:src="blog.image" />
		<h2>{{ blog.author?.first_name }} {{ blog.author?.last_name }}</h2>
		<small>{{ blog.published_at }}</small>
		<pre>{{ blog.content }}</pre>
	</div>
</template>
