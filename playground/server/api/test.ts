export default defineEventHandler(async (_req) => {
  const directus = useAdminDirectus()

  const _test = await directus.request(readItems('modules_landing_content', {}))

  return {
    message: 'Hello world',
  }
})
