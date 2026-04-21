import { defineEventHandler, readItems, useAdminDirectus } from '#imports'

export default defineEventHandler(async () => {
  const directus = useAdminDirectus()
  const posts = await directus.request(readItems('posts', { limit: 3, fields: ['id', 'title', 'status'] }))

  return { composable: 'useAdminDirectus()', posts }
})
