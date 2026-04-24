import { defineEventHandler, getQuery, useTokenDirectus } from '#imports'
import { readMe } from '@directus/sdk'

interface TokenUser {
  id: string
  email: string
  first_name: string
  last_name: string
}

interface TokenResponse {
  composable: string
  user?: TokenUser
  error?: string
}

export default defineEventHandler(async (event): Promise<TokenResponse> => {
  const { token } = getQuery(event)

  if (!token || typeof token !== 'string') {
    return { composable: 'useTokenDirectus(token)', error: 'Pass ?token=<your-token> in the query string.' }
  }

  const directus = useTokenDirectus(token)
  const user = await directus.request(readMe({ fields: ['id', 'email', 'first_name', 'last_name'] }))

  return { composable: 'useTokenDirectus(token)', user: user as TokenUser }
})
