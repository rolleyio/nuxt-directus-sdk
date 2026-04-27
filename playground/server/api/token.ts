// In your project, none of these imports are needed.
// The module registers useTokenDirectus, defineEventHandler, getQuery, and all
// @directus/sdk functions (including readMe) as Nitro auto-imports; they are
// available globally in every server route without any import statement.
// H3Event is also available as a global type in Nitro server routes, so the
// `event: H3Event` annotation works without importing it.
import { readMe } from '@directus/sdk'
import { defineEventHandler, getQuery } from 'h3'
import type { H3Event } from 'h3'
import { useTokenDirectus } from '../../../src/runtime/server/services/directus'

export default defineEventHandler(async (event: H3Event) => {
  const { token } = getQuery(event)

  if (!token || typeof token !== 'string') {
    return { composable: 'useTokenDirectus(token)', error: 'Pass ?token=<your-token> in the query string.' }
  }

  const directus = useTokenDirectus(token)
  const user = await directus.request(readMe({ fields: ['id', 'email', 'first_name', 'last_name'] }))

  return { composable: 'useTokenDirectus(token)', user }
})
