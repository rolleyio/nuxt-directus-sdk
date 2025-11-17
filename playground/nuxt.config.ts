export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: {
    enabled: true,
  },
  directus: {
    // url: import.emeta.env.DIRECTUS_URL
    // adminToken: import.meta.env.DIRECTUS_ADMIN_TOKEN
    devProxy: {
      enabled: true,
      path: '/directus'
    },
    devtools: true,
    visualEditor: true,
    types: {
      enabled: true,
      prefix: 'DPRE',
    },
    auth: {
      enabled: true,
      enableGlobalAuthMiddleware: false,
      autoRefresh: true,
      credentials: 'include',
      realtimeAuthMode: 'public',
      readMeFields: ['id', 'first_name', 'last_name', 'email'],
      redirect: {
        home: '/dashboard',
        login: '/auth/login',
        logout: '/',
      },
    }
  },
  routeRules: {
    '/**': {
      headers: {
        'x-frame-options': 'allowall',
      },
    },
  },

  compatibilityDate: '2025-03-13',
  typescript: {
    includeWorkspace: true
  }
})
