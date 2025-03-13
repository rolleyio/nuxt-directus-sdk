export default defineEventHandler(async (req) => {
  const directus = useAdminDirectus()

  const test = await directus.request(readItems('modules_landing_content', {}))

  return {
    message: 'Hello world',
  }
})
