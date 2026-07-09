import type { RegularCollections, SubscribeOptions, UnpackList } from '@directus/sdk'
import type { Ref } from '#imports'
import { onScopeDispose, ref, shallowRef } from '#imports'
import { useDirectus } from './directus'

type CollectionName = RegularCollections<DirectusSchema>
type CollectionItem<C extends CollectionName> = UnpackList<DirectusSchema[C]>

export type DirectusSubscriptionStatus = 'idle' | 'connecting' | 'open' | 'error' | 'closed'

export interface UseDirectusSubscriptionOptions<C extends CollectionName>
  extends SubscribeOptions<DirectusSchema, C> {
  /**
   * When true (default), maintain a reactive `items` list from init/create/update/delete events.
   */
  syncList?: boolean
  /**
   * Item field used to reconcile update and delete events.
   * @default 'id'
   */
  keyField?: Extract<keyof CollectionItem<C>, string>
  /**
   * When true (default), auto-connect on setup. Set false to connect manually via `connect()`.
   */
  immediate?: boolean
}

export interface UseDirectusSubscriptionReturn<C extends CollectionName> {
  items: Ref<CollectionItem<C>[]>
  status: Ref<DirectusSubscriptionStatus>
  error: Ref<Error | null>
  lastEvent: Ref<{ event: string, data: unknown } | null>
  connect: () => Promise<void>
  disconnect: () => void
}

type SubscriptionMessage<T>
  = | { event: 'init' | 'create' | 'update', data: T[] }
    | { event: 'delete', data: Array<string | number> }
    | { event: 'error', error: { code?: string, message?: string } }

/**
 * Subscribe to a Directus collection over WebSocket with automatic cleanup.
 *
 * @example
 * ```ts
 * const { items, status } = useDirectusSubscription('posts', {
 *   query: { fields: ['id', 'title'] },
 * })
 * ```
 */
export function useDirectusSubscription<C extends CollectionName>(
  collection: C,
  options: UseDirectusSubscriptionOptions<C> = {},
): UseDirectusSubscriptionReturn<C> {
  const {
    syncList = true,
    immediate = true,
    keyField = 'id' as Extract<keyof CollectionItem<C>, string>,
    ...subscribeOptions
  } = options

  const directus = useDirectus()
  const items = shallowRef<CollectionItem<C>[]>([])
  const status = ref<DirectusSubscriptionStatus>('idle')
  const error = ref<Error | null>(null)
  const lastEvent = shallowRef<{ event: string, data: unknown } | null>(null)

  let unsubscribe: (() => void) | null = null
  let generation = 0

  function safelyUnsubscribe(callback: (() => void) | null) {
    try {
      callback?.()
    }
    catch {
      // The SDK throws if the shared socket has already closed.
    }
  }

  function getItemKey(item: CollectionItem<C>): string | null {
    const value = (item as Record<string, unknown>)[keyField]
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : null
  }

  function failListSync(message: string): false {
    error.value = new Error(message)
    status.value = 'error'
    return false
  }

  function replaceItems(rows: CollectionItem<C>[]): boolean {
    if (rows.some(row => getItemKey(row) === null)) {
      return failListSync(`Directus subscription item is missing key field "${keyField}"`)
    }
    items.value = rows
    return true
  }

  function upsertItems(rows: CollectionItem<C>[]): boolean {
    const currentKeys = items.value.map(getItemKey)
    const incomingKeys = rows.map(getItemKey)
    if (currentKeys.includes(null) || incomingKeys.includes(null)) {
      return failListSync(`Directus subscription item is missing key field "${keyField}"`)
    }

    const incoming = new Map<string, CollectionItem<C>>()
    for (const [index, key] of incomingKeys.entries())
      incoming.set(key!, rows[index]!)

    const next: CollectionItem<C>[] = items.value.map((row, index) => incoming.get(currentKeys[index]!) ?? row)
    const existing = new Set(currentKeys)
    for (const [index, key] of incomingKeys.entries()) {
      if (!existing.has(key))
        next.push(rows[index]!)
    }
    items.value = next
    return true
  }

  function deleteItems(keys: Array<string | number>): boolean {
    const currentKeys = items.value.map(getItemKey)
    if (currentKeys.includes(null))
      return failListSync(`Directus subscription item is missing key field "${keyField}"`)

    const deleted = new Set(keys.map(String))
    items.value = items.value.filter((_row, index) => !deleted.has(currentKeys[index]!))
    return true
  }

  async function connect() {
    if (import.meta.server)
      return

    const connectionGeneration = ++generation
    safelyUnsubscribe(unsubscribe)
    unsubscribe = null
    status.value = 'connecting'
    error.value = null

    try {
      const sub = await directus.subscribe(collection, subscribeOptions as never)
      const subscriptionUnsubscribe = () => sub.unsubscribe()
      if (connectionGeneration !== generation) {
        safelyUnsubscribe(subscriptionUnsubscribe)
        return
      }

      unsubscribe = subscriptionUnsubscribe
      status.value = 'open'

      void (async () => {
        try {
          for await (const rawMessage of sub.subscription) {
            if (connectionGeneration !== generation)
              break

            const message = rawMessage as unknown as SubscriptionMessage<CollectionItem<C>>
            lastEvent.value = {
              event: message.event,
              data: 'data' in message ? message.data : 'error' in message ? message.error : null,
            }

            if (message.event === 'error') {
              const messageText = 'error' in message ? message.error.message : 'Directus subscription error'
              error.value = new Error(messageText || 'Directus subscription error')
              status.value = 'error'
              safelyUnsubscribe(subscriptionUnsubscribe)
              return
            }

            if (!syncList)
              continue

            if (message.event === 'init') {
              if (!replaceItems(message.data ?? []))
                return safelyUnsubscribe(subscriptionUnsubscribe)
            }
            else if (message.event === 'create') {
              if (!upsertItems(message.data))
                return safelyUnsubscribe(subscriptionUnsubscribe)
            }
            else if (message.event === 'update') {
              if (!upsertItems(message.data))
                return safelyUnsubscribe(subscriptionUnsubscribe)
            }
            else if (message.event === 'delete') {
              if (!deleteItems(message.data))
                return safelyUnsubscribe(subscriptionUnsubscribe)
            }
          }
          if (connectionGeneration === generation && status.value !== 'error')
            status.value = 'closed'
        }
        catch (err) {
          if (connectionGeneration === generation) {
            error.value = err instanceof Error ? err : new Error(String(err))
            status.value = 'error'
          }
        }
        finally {
          if (connectionGeneration === generation)
            unsubscribe = null
        }
      })()
    }
    catch (err) {
      if (connectionGeneration === generation) {
        error.value = err instanceof Error ? err : new Error(String(err))
        status.value = 'error'
      }
    }
  }

  function disconnect() {
    generation++
    safelyUnsubscribe(unsubscribe)
    unsubscribe = null
    if (status.value !== 'idle')
      status.value = 'closed'
  }

  if (immediate && import.meta.client)
    void connect()

  onScopeDispose(() => {
    disconnect()
  })

  return {
    items,
    status,
    error,
    lastEvent,
    connect,
    disconnect,
  }
}
