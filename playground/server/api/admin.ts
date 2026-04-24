import { defineEventHandler, readItems, useAdminDirectus } from '#imports'

interface AdminResponse {
  composable: string
  posts: { id: string, title: string, status: string }[]
}

export default defineEventHandler(async (): Promise<AdminResponse> => {
  const directus = useAdminDirectus()
  const posts = await directus.request(readItems('posts', { limit: 3, fields: ['id', 'title', 'status'] }))

  return { composable: 'useAdminDirectus()', posts: posts as AdminResponse['posts'] }
})
