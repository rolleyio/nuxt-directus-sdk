import { defineEventHandler, getDirectusSessionToken, useServerDirectus } from '#imports'
import { readMe } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  const token = getDirectusSessionToken(event)

  if (!token) {
    return { composable: 'useServerDirectus(event)', error: 'No session token found. Log in first.' }
  }

  const directus = useServerDirectus(event)
  const user = await directus.request(readMe({ fields: ['id', 'email', 'first_name', 'last_name'] }))

  return { composable: 'useServerDirectus(event)', user }
})
