import { useRuntimeConfig } from '#imports'
import { defineEventHandler, getRequestURL, proxyRequest } from 'h3'
import { joinURL } from 'ufo'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const directusUrl = (config.public.directus as any).directusUrl

  // Get the full URL path with query string
  const url = getRequestURL(event)
  const path = url.pathname.replace(/^\/directus/, '') + url.search

  // Proxy the request to Directus with fetch options to handle compression
  return proxyRequest(event, joinURL(directusUrl, path))
})
