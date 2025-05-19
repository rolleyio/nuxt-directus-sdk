export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: {
    enabled: false,
  },

  directus: {
    devtools: false,
    auth: {
      readMeFields: ['id', 'first_name', 'last_name', 'email'],
    },
  },

  typescript: {
    includeWorkspace: true,
  },

  routeRules: {
    '/**': {
      headers: {
        'x-frame-options': false,
      },
    },
  },

  compatibilityDate: '2025-03-13',
})
