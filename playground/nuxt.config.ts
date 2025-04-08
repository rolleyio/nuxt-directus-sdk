export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: {
    enabled: false,
  },

  directus: {
    devtools: false,
    fetchUserFields: ['id', 'first_name', 'last_name'],
  },

  typescript: {
    includeWorkspace: true,
  },

  compatibilityDate: '2025-03-13',
})
