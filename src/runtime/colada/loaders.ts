import type { RouteLocationNormalizedLoaded, RouteMap } from 'vue-router'
import type {
  DataColadaLoaderContext,
  DefineDataColadaLoaderOptions_LaxData,
  UseDataLoaderColada_LaxData,
} from 'vue-router/experimental/pinia-colada'
import { tryUseNuxtApp } from '#imports'
import { hasInjectionContext, inject } from 'vue'
import { defineColadaLoader } from 'vue-router/experimental/pinia-colada'
import { useDirectus } from '../composables/directus'
import { dataLoaderNuxtApp } from './context'

export type DirectusClient = ReturnType<typeof useDirectus>

export interface DefineDirectusLoaderOptions<Name extends keyof RouteMap, Data>
  extends Omit<DefineDataColadaLoaderOptions_LaxData<Name, Data>, 'query'> {
  /**
   * Fetches the data for the loader. Receives the Directus client, the target
   * route, and the loader context (`signal` aborts on cancelled navigations).
   */
  query: (
    directus: DirectusClient,
    to: RouteLocationNormalizedLoaded<Name>,
    context: DataColadaLoaderContext,
  ) => Promise<Data>
}

/**
 * Defines a vue-router data loader backed by the Pinia Colada cache with the
 * Directus client injected into the query.
 *
 * Data loaders run during navigation (inside the router guard), so the data
 * is ready on first paint with no `await` in setup. Export the loader from
 * the page component that uses it so the router picks it up.
 *
 * @example
 * ```vue
 * <script lang="ts">
 * export const usePostLoader = defineDirectusLoader({
 *   key: to => ['posts', to.params.slug as string],
 *   query: (directus, to) => directus.request(readItems('posts', {
 *     filter: { slug: { _eq: to.params.slug as string } },
 *     limit: 1,
 *   })).then(posts => posts[0] ?? null),
 *   staleTime: 1000 * 60 * 5,
 * })
 * </script>
 *
 * <script setup lang="ts">
 * const { data: post, isLoading } = usePostLoader()
 * </script>
 * ```
 */
export function defineDirectusLoader<Name extends keyof RouteMap, Data>(
  name: Name,
  options: DefineDirectusLoaderOptions<Name, Data>,
): UseDataLoaderColada_LaxData<Data>
export function defineDirectusLoader<Data>(
  options: DefineDirectusLoaderOptions<keyof RouteMap, Data>,
): UseDataLoaderColada_LaxData<Data>
export function defineDirectusLoader(
  nameOrOptions: keyof RouteMap | DefineDirectusLoaderOptions<keyof RouteMap, unknown>,
  maybeOptions?: DefineDirectusLoaderOptions<keyof RouteMap, unknown>,
): UseDataLoaderColada_LaxData<unknown> {
  const name = typeof nameOrOptions === 'string' ? nameOrOptions : undefined
  const { query, ...loaderOptions } = (name ? maybeOptions : nameOrOptions) as DefineDirectusLoaderOptions<keyof RouteMap, unknown>

  const wrapped = {
    ...loaderOptions,
    query: (to: RouteLocationNormalizedLoaded, context: DataColadaLoaderContext) => {
      // Loaders run in the router's navigation guard, outside component
      // setup, where tryUseNuxtApp() finds nothing on the server. The guard
      // wraps loaders in app.runWithContext(), so app-level inject() reaches
      // the Nuxt app provided by the data-loaders plugin. Restore the Nuxt
      // context from it so useDirectus() (runtime config, SSR cookie
      // forwarding) works inside the query.
      const nuxtApp = tryUseNuxtApp() ?? (hasInjectionContext() ? inject(dataLoaderNuxtApp, null) : null)
      const run = () => query(useDirectus(), to, context)
      return nuxtApp ? nuxtApp.runWithContext(run) : run()
    },
  }

  return name
    ? defineColadaLoader(name, wrapped as never)
    : defineColadaLoader(wrapped as never)
}
