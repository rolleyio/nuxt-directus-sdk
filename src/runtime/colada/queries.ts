import type {
  Query,
  QueryItem,
  RegularCollections,
  SingletonCollections,
  UnpackList,
} from '@directus/sdk'
import type { EntryKey, UseQueryOptions, UseQueryReturn } from '@pinia/colada'
import type { MaybeRefOrGetter } from 'vue'
import { readItem, readItems, readSingleton } from '@directus/sdk'
import { useQuery } from '@pinia/colada'
import { toValue } from 'vue'
import { useDirectus } from '../composables/directus'

type RegularCollectionName = RegularCollections<DirectusSchema>
type SingletonCollectionName = SingletonCollections<DirectusSchema>
type CollectionItem<C extends keyof DirectusSchema> = UnpackList<DirectusSchema[C]>
type DirectusUseQueryOptions<T> = Omit<UseQueryOptions<T>, 'key' | 'query'>

// Directus query objects are plain JSON, so they can be embedded in the
// Colada entry key directly. `?? null` keeps "no query" a stable key segment.
function toKeySegment(query: unknown): EntryKey[number] {
  return (query ?? null) as EntryKey[number]
}

export interface UseDirectusItemsQueryOptions<C extends RegularCollectionName, T>
  extends DirectusUseQueryOptions<T> {
  /** Explicit Colada entry key. Defaults to `['directus', 'items', collection, query]`. */
  key?: MaybeRefOrGetter<EntryKey>
  query?: MaybeRefOrGetter<Query<DirectusSchema, CollectionItem<C>>>
}

/**
 * Fetch a list of items through the Pinia Colada cache.
 *
 * Unlike `useDirectusItems` (which uses `useAsyncData`), the result is cached
 * and shared by key across every component that calls it, and refetched
 * according to `staleTime`/`refetchOn*` options.
 *
 * @example
 * ```ts
 * const { data: posts, isLoading } = useDirectusItemsQuery('posts', {
 *   query: { filter: { status: { _eq: 'published' } }, sort: ['-date_created'] },
 *   staleTime: 1000 * 60 * 5,
 * })
 * ```
 */
export function useDirectusItemsQuery<
  C extends RegularCollectionName,
  T = CollectionItem<C>[],
>(
  collection: C,
  options: UseDirectusItemsQueryOptions<C, T> = {},
): UseQueryReturn<T> {
  const { key, query, ...queryOptions } = options
  const directus = useDirectus()

  return useQuery({
    key: key ?? (() => ['directus', 'items', collection, toKeySegment(toValue(query))]),
    query: async () => await directus.request(readItems(collection, toValue(query) as never)) as T,
    ...queryOptions,
  } as UseQueryOptions<T>)
}

export interface UseDirectusItemQueryOptions<C extends RegularCollectionName, T>
  extends DirectusUseQueryOptions<T> {
  key?: MaybeRefOrGetter<EntryKey>
  query?: MaybeRefOrGetter<QueryItem<DirectusSchema, CollectionItem<C>>>
}

/**
 * Fetch a single item by primary key through the Pinia Colada cache.
 *
 * Pass a ref/getter as `id` (e.g. `() => route.params.id`) to refetch when it
 * changes: the id is part of the entry key.
 *
 * @example
 * ```ts
 * const route = useRoute()
 * const { data: post } = useDirectusItemQuery('posts', () => route.params.id as string, {
 *   query: { fields: ['*', { author: ['name'] }] },
 * })
 * ```
 */
export function useDirectusItemQuery<
  C extends RegularCollectionName,
  T = CollectionItem<C>,
>(
  collection: C,
  id: MaybeRefOrGetter<string | number>,
  options: UseDirectusItemQueryOptions<C, T> = {},
): UseQueryReturn<T> {
  const { key, query, ...queryOptions } = options
  const directus = useDirectus()

  return useQuery({
    key: key ?? (() => ['directus', 'item', collection, toValue(id), toKeySegment(toValue(query))]),
    query: async () => await directus.request(readItem(collection, toValue(id), toValue(query) as never)) as T,
    ...queryOptions,
  } as UseQueryOptions<T>)
}

export interface UseDirectusSingletonQueryOptions<C extends SingletonCollectionName, T>
  extends DirectusUseQueryOptions<T> {
  key?: MaybeRefOrGetter<EntryKey>
  query?: MaybeRefOrGetter<QueryItem<DirectusSchema, CollectionItem<C>>>
}

/**
 * Fetch a singleton collection (e.g. settings) through the Pinia Colada cache.
 *
 * @example
 * ```ts
 * const { data: settings } = useDirectusSingletonQuery('settings', {
 *   staleTime: 1000 * 60 * 10,
 * })
 * ```
 */
export function useDirectusSingletonQuery<
  C extends SingletonCollectionName,
  T = CollectionItem<C>,
>(
  collection: C,
  options: UseDirectusSingletonQueryOptions<C, T> = {},
): UseQueryReturn<T> {
  const { key, query, ...queryOptions } = options
  const directus = useDirectus()

  return useQuery({
    key: key ?? (() => ['directus', 'singleton', collection, toKeySegment(toValue(query))]),
    query: async () => await directus.request(readSingleton(collection, toValue(query) as never)) as T,
    ...queryOptions,
  } as UseQueryOptions<T>)
}
