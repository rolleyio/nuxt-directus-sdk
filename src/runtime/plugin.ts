import auth from './middleware/auth'
import { useDirectus } from './composables/directus'
import { useDirectusAuth } from './composables/auth'
import { addRouteMiddleware, defineNuxtPlugin, refreshNuxtData, useRoute, useRuntimeConfig } from '#app'

export default defineNuxtPlugin(async (nuxt) => {
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

		nuxt.hook('page:finish', () => {
			refreshNuxtData();
		});
	}

  if (config.public.directus.fetchUser)
    await useDirectusAuth().fetchUser()

  addRouteMiddleware('auth', auth)
})
