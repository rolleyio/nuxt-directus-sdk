import auth from './middleware/auth'
import { useDirectus } from './composables/directus'
import { useDirectusAuth, useDirectusUser } from './composables/auth'
import { addRouteMiddleware, defineNuxtPlugin, refreshNuxtData, useRoute, useRuntimeConfig } from '#app'

export default defineNuxtPlugin(async (nuxtApp) => {
  const route = useRoute()
  const config = useRuntimeConfig()

  // TEST that live preview works with token
  // ** Live Preview Bits **
	// Check if we are in preview mode
	const preview = route.query.preview && route.query.preview === 'true';
	const token = route.query.token as string | undefined;

	// If we are in preview mode, we need to use the token from the query string
	if (preview && token) {
		useDirectus().setToken(token);

		nuxtApp.hook('page:finish', () => {
			refreshNuxtData();
		});
	}

	// TEST the hook is used somewhere else, but not sure it is needed
	async function fetchUser() {
		if (config.public.directus.fetchUser)
			await useDirectusAuth().readMe()
	}

	await fetchUser()

	nuxtApp.hook('page:start', async () => {
		if (process.client) {
			await fetchUser()
		}
	})

  await nuxtApp.callHook('directus:loggedIn', useDirectusUser().value)

  addRouteMiddleware('auth', auth)
})
