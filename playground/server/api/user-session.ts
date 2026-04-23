import { defineEventHandler, getDirectusSessionToken, useSessionDirectus } from '#imports'
import { readMe } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  const token = getDirectusSessionToken(event)

  if (!token) {
    return { composable: 'useSessionDirectus(event)', error: 'No session token found. Log in first.' }
  }

  const directus = useSessionDirectus(event)
  const user = await directus.request(readMe({ fields: ['id', 'email', 'first_name', 'last_name'] }))

  return { composable: 'useSessionDirectus(event)', user }
})
