import { defineEventHandler, readItems, useAdminDirectus } from "#imports"

export default defineEventHandler(async (_req) => {
  const directus = useAdminDirectus()

  const _test = await directus.request(readItems('blogs', {}))

  return {
    message: 'Hello from /api/test',
  }
})
