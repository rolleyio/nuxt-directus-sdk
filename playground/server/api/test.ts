export default defineEventHandler(async (req) => {
  const directus = useAdminDirectus()
  
  const test = await directus.request(readItems('concilio', {}))

  return {
    message: 'Hello world'
  }
})
