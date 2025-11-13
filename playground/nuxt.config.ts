export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: {
    enabled: false,
  },

  directus: {
    devtools: false,
    // devProxy automatically enabled in dev mode
    // Customize if needed:
    // devProxy: false, // disable
    // devProxy: { enabled: true, path: '/api' }, // custom path
    auth: {
      readMeFields: ['id', 'first_name', 'last_name', 'email'],
    },
    types: {
      prefix: 'Rolley',
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
