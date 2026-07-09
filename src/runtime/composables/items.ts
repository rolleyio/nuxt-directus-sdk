import type { AsyncData, AsyncDataOptions, NuxtError } from 'nuxt/app'
import type {
  Query,
  QueryItem,
  RegularCollections,
  SingletonCollections,
  UnpackList,
} from '@directus/sdk'
import { readItem, readItems, readSingleton } from '@directus/sdk'
import { useAsyncData } from '#imports'
import { useDirectus } from './directus'

type RegularCollectionName = RegularCollections<DirectusSchema>
type SingletonCollectionName = SingletonCollections<DirectusSchema>
type CollectionItem<C extends keyof DirectusSchema> = UnpackList<DirectusSchema[C]>
type DirectusAsyncData<T> = AsyncData<T | undefined, NuxtError | undefined>
type DirectusAsyncDataOptions<T> = Omit<AsyncDataOptions<T>, 'default' | 'pick' | 'transform'>

export interface UseDirectusItemsOptions<C extends RegularCollectionName, T>
  extends DirectusAsyncDataOptions<T> {
  /** Explicit useAsyncData key. Defaults to `directus:{collection}:{hash}`. */
  key?: string
  query?: Query<DirectusSchema, CollectionItem<C>>
}

function buildKey(parts: unknown[]): string {
  return `directus:${parts.map(p => typeof p === 'string' ? p : JSON.stringify(p ?? null)).join(':')}`
}

/**
 * Fetch a list of items with useAsyncData + full schema typing.
 *
 * @example
 * ```ts
 * const { data: posts } = await useDirectusItems('posts', {
 *   query: { filter: { status: { _eq: 'published' } }, sort: ['-date_created'] },
 * })
 * ```
 */
export function useDirectusItems<
  C extends RegularCollectionName,
  T = CollectionItem<C>[],
>(
  collection: C,
  options: UseDirectusItemsOptions<C, T> = {},
): DirectusAsyncData<T> {
  const { key, query, ...asyncOptions } = options
  const dataKey = key ?? buildKey(['items', collection, query])
  const directus = useDirectus()

  return useAsyncData(
    dataKey,
    async () => await directus.request(readItems(collection, query as never)) as T,
    asyncOptions as AsyncDataOptions<T>,
  ) as unknown as DirectusAsyncData<T>
}

export interface UseDirectusItemOptions<C extends RegularCollectionName, T>
  extends DirectusAsyncDataOptions<T> {
  key?: string
  query?: QueryItem<DirectusSchema, CollectionItem<C>>
}

/**
 * Fetch a single item by primary key.
 *
 * @example
 * ```ts
 * const { data: post } = await useDirectusItem('posts', id, {
 *   query: { fields: ['*', { author: ['name'] }] },
 * })
 * ```
 */
export function useDirectusItem<
  C extends RegularCollectionName,
  T = CollectionItem<C>,
>(
  collection: C,
  id: string | number,
  options: UseDirectusItemOptions<C, T> = {},
): DirectusAsyncData<T> {
  const { key, query, ...asyncOptions } = options
  const dataKey = key ?? buildKey(['item', collection, id, query])
  const directus = useDirectus()

  return useAsyncData(
    dataKey,
    async () => await directus.request(readItem(collection, id, query as never)) as T,
    asyncOptions as AsyncDataOptions<T>,
  ) as unknown as DirectusAsyncData<T>
}

export interface UseDirectusSingletonOptions<C extends SingletonCollectionName, T>
  extends DirectusAsyncDataOptions<T> {
  key?: string
  query?: QueryItem<DirectusSchema, CollectionItem<C>>
}

/**
 * Fetch a singleton collection (e.g. settings).
 */
export function useDirectusSingleton<
  C extends SingletonCollectionName,
  T = CollectionItem<C>,
>(
  collection: C,
  options: UseDirectusSingletonOptions<C, T> = {},
): DirectusAsyncData<T> {
  const { key, query, ...asyncOptions } = options
  const dataKey = key ?? buildKey(['singleton', collection, query])
  const directus = useDirectus()

  return useAsyncData(
    dataKey,
    async () => await directus.request(readSingleton(collection, query as never)) as T,
    asyncOptions as AsyncDataOptions<T>,
  ) as unknown as DirectusAsyncData<T>
}
