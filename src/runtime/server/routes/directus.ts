import { useRuntimeConfig } from '#imports'
import { defineEventHandler, getRequestURL, proxyRequest } from 'h3'
import { joinURL } from 'ufo'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const directusUrl = config.public.directus.directusUrl

  // Get the full URL path with query string
  const url = getRequestURL(event)
  const path = url.pathname.replace(/^\/directus/, '') + url.search

  // Proxy the request to Directus
  // Note: WebSocket connections are not supported through this proxy, custom proxy written in module.ts
  return proxyRequest(event, joinURL(directusUrl, path))
})
