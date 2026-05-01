// In your project, none of these imports are needed.
// The module registers useAdminDirectus, defineEventHandler, and all
// @directus/sdk functions (including readItems) as Nitro auto-imports;
// they are available globally in every server route without any import statement.
import { readItems } from '#imports'
import { defineEventHandler } from 'h3'
import { useAdminDirectus } from '../../../src/runtime/server/services/directus'

export default defineEventHandler(async () => {
  const directus = useAdminDirectus()
  const posts = await directus.request(readItems('posts', { limit: 3, fields: ['id', 'title', 'status'] }))

  return { composable: 'useAdminDirectus()', posts }
})
