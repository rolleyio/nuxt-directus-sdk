export default defineNuxtConfig({
  modules: ['../src/module'],
  directus: {
    devtools: true,
    fetchUserParams: {
      fields: ['first_name', 'last_name'],
    },
  },
  typescript: {
    includeWorkspace: true,
  },
})
