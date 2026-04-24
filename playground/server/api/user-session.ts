import { defineEventHandler, getDirectusSessionToken, useSessionDirectus } from '#imports'
import { readMe } from '@directus/sdk'

interface SessionUser {
  id: string
  email: string
  first_name: string
  last_name: string
}

interface SessionResponse {
  composable: string
  user?: SessionUser
  error?: string
}

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const token = getDirectusSessionToken(event)

  if (!token) {
    return { composable: 'useSessionDirectus(event)', error: 'No session token found. Log in first.' }
  }

  const directus = useSessionDirectus(event)
  const user = await directus.request(readMe({ fields: ['id', 'email', 'first_name', 'last_name'] }))

  return { composable: 'useSessionDirectus(event)', user: user as SessionUser }
})
