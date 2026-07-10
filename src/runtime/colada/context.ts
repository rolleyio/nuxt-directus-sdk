import type { NuxtApp } from 'nuxt/app'
import type { InjectionKey } from 'vue'

// Data loaders run in the router's navigation guard, where no component
// instance or unctx async context exists, so tryUseNuxtApp() comes back
// empty on the server. The loader guard does wrap execution in Vue's
// app.runWithContext(), which makes app-level inject() work; the
// data-loaders plugin provides the Nuxt app under this key so loaders can
// restore the Nuxt context from it.
export const dataLoaderNuxtApp: InjectionKey<NuxtApp> = Symbol('directus-data-loader-nuxt-app')
