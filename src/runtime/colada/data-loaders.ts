import type { DataLoaderPluginOptions } from 'vue-router/experimental'
import { defineNuxtPlugin } from '#imports'
import { DataLoaderPlugin } from 'vue-router/experimental'
import { dataLoaderNuxtApp } from './context'

// Enables vue-router data loaders (defineDirectusLoader / defineColadaLoader).
// Loaders run inside the navigation guard, so page data is ready on first
// paint. Vue deduplicates repeated app.use() of the same plugin, so an app
// that already installs DataLoaderPlugin itself is unaffected (a dev-mode
// warning aside); set `experimental.dataLoaders.registerPlugin: false` to
// skip this.
export default defineNuxtPlugin({
  name: 'directus:data-loaders',
  dependsOn: ['nuxt:router'],
  setup(nuxtApp) {
    const router = nuxtApp.vueApp.config.globalProperties.$router

    if (!router) {
      return
    }

    // Loaders resolve the Nuxt app through app-level injection; see context.ts.
    nuxtApp.vueApp.provide(dataLoaderNuxtApp, nuxtApp as never)

    nuxtApp.vueApp.use(DataLoaderPlugin, {
      router,
      isSSR: import.meta.server,
    } satisfies DataLoaderPluginOptions)
  },
})
