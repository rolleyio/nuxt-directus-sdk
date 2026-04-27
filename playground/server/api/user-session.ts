// In your project, none of these imports are needed.
// The module registers useSessionDirectus, getDirectusSessionToken,
// defineEventHandler, and all @directus/sdk functions (including readMe) as
// Nitro auto-imports; they are available globally in every server route
// without any import statement.
// H3Event is also available as a global type in Nitro server routes, so the
// `event: H3Event` annotation works without importing it.
import { readMe } from '@directus/sdk'
import { defineEventHandler } from 'h3'
import type { H3Event } from 'h3'
import { getDirectusSessionToken, useSessionDirectus } from '../../../src/runtime/server/services/directus'

export default defineEventHandler(async (event: H3Event) => {
  const token = getDirectusSessionToken(event)

  if (!token) {
    return { composable: 'useSessionDirectus(event)', error: 'No session token found. Log in first.' }
  }

  const directus = useSessionDirectus(event)
  const user = await directus.request(readMe({ fields: ['id', 'email', 'first_name', 'last_name'] }))

  return { composable: 'useSessionDirectus(event)', user }
})
