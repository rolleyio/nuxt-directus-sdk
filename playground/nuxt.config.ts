export default defineNuxtConfig({
  modules: ['../src/module'],
  rolley: {
    devtools: true,
    fetchUserParams: {
      fields: ['']
    },
  },
  typescript: {
    includeWorkspace: true,
  },
})
