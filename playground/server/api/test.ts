export default defineEventHandler(async (req) => {
  const directus = useAdminDirectus()

  const test = await directus.request(readItems('test', {}))

  return {
    message: 'Hello world',
  }
})
