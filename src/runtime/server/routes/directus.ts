import { useRuntimeConfig } from '#imports'
import { defineEventHandler, getRequestURL, proxyRequest, setResponseHeaders } from 'h3'
import { joinURL } from 'ufo'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const directusUrl = config.public.directus.directusUrl

  // Get the full URL path with query string
  const url = getRequestURL(event)
  const path = url.pathname.replace(/^\/directus/, '') + url.search

  // Proxy the request to Directus
  // Note: WebSocket connections are not supported through this proxy, custom proxy written in module.ts
  await proxyRequest(event, joinURL(directusUrl, path), {
    // Intercept response to rewrite cookies for local development
    onResponse(proxyEvent, response) {
      // Get Set-Cookie headers
      const setCookieHeaders = response.headers.getSetCookie?.() || []

      if (setCookieHeaders.length > 0) {
        // Rewrite each cookie to work with local development
        const rewrittenCookies = setCookieHeaders.map((cookie) => {
          // Remove Domain attribute to allow cookies to work on localhost
          // This allows cookies to work in local dev regardless of Directus domain
          let rewrittenCookie = cookie.replace(/;\s*Domain=[^;]+/gi, '')

          // Handle SameSite for Safari compatibility
          const hasSameSiteNone = rewrittenCookie.match(/SameSite=None/i)

          if (hasSameSiteNone) {
            // Safari requires Secure flag with SameSite=None
            // But Secure doesn't work on localhost HTTP, so change to SameSite=Lax
            rewrittenCookie = rewrittenCookie
              .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
              .replace(/;\s*Secure\s*(?=;|$)/gi, '') // Remove Secure flag for localhost HTTP
          }
          else {
            // Remove Secure flag for localhost HTTP
            rewrittenCookie = rewrittenCookie.replace(/;\s*Secure\s*(?=;|$)/gi, '')

            // Ensure SameSite is set for Safari compatibility
            if (!rewrittenCookie.match(/SameSite=/i)) {
              rewrittenCookie += '; SameSite=Lax'
            }
          }

          return rewrittenCookie
        })

        // Set rewritten cookies on the proxy event (our Nuxt response)
        setResponseHeaders(proxyEvent, {
          'set-cookie': rewrittenCookies,
        })
      }
    },
  })
})
