import { defineEventHandler, getQuery, useTokenDirectus } from '#imports'
import { readMe } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  const { token } = getQuery(event)

  if (!token || typeof token !== 'string') {
    return { composable: 'useTokenDirectus(token)', error: 'Pass ?token=<your-token> in the query string.' }
  }

  const directus = useTokenDirectus(token)
  const user = await directus.request(readMe({ fields: ['id', 'email', 'first_name', 'last_name'] }))

  return { composable: 'useTokenDirectus(token)', user }
})
