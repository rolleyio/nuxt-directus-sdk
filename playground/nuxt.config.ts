export default defineNuxtConfig({
  modules: ['../src/module'],

  directus: {
    devtools: true,
    fetchUserFields: ['first_name', 'last_name'],
  },

  typescript: {
    includeWorkspace: true,
  },

  compatibilityDate: '2025-03-13',
})
