// Cookie rewriting for the proxy server handler. Pure function — kept in its
// own module so it can be unit-tested without spinning up h3.

export interface RewriteOptions {
  /**
   * Whether the incoming request reaching the proxy is HTTPS.
   * - On HTTPS (production, staging): preserve `Secure` and `SameSite=None` as
   *   Directus set them — they're valid and load-bearing for cross-context flows.
   * - On HTTP (localhost dev): strip `Secure` (browser rejects on http://) and
   *   downgrade `SameSite=None` to `Lax` (browser rejects `None` without `Secure`).
   */
  isHttps: boolean
}

export function isRequestHttps(
  url: Pick<URL, 'protocol'>,
  forwardedProtocol?: string | string[],
): boolean {
  const raw = Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol
  const protocol = raw?.split(',')[0]?.trim().toLowerCase()
  return protocol === 'https' || url.protocol === 'https:'
}

/**
 * Rewrite a single `Set-Cookie` header value from a proxied Directus response
 * so it works on the proxy origin (e.g. `your-app.vercel.app` or `localhost`).
 *
 * Always:
 *  - Strips the `Domain` attribute. The cookie binds to the response origin
 *    instead, which is what we want — it lets the browser store the cookie on
 *    your Nuxt app's host rather than Directus's.
 *
 * On HTTP only:
 *  - Strips `Secure` (browsers reject `Secure` cookies over plain HTTP).
 *  - Downgrades `SameSite=None` to `SameSite=Lax` (browsers reject `None`
 *    without `Secure`).
 *  - Adds `SameSite=Lax` if the cookie has no `SameSite` directive at all
 *    (Safari/Chrome treat missing `SameSite` as `Lax` anyway; making it
 *    explicit avoids future warnings).
 */
export function rewriteProxiedSetCookie(cookie: string, options: RewriteOptions): string {
  let result = cookie.replace(/;\s*Domain=[^;]+/gi, '')

  if (options.isHttps) {
    // HTTPS path: leave Secure and SameSite as Directus set them. Just the
    // domain strip is needed so the browser binds the cookie to our origin.
    return result
  }

  // HTTP path (localhost dev). The browser would reject `Secure` and
  // `SameSite=None` over plain HTTP, so downgrade.
  if (/SameSite=None/i.test(result)) {
    result = result
      .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
      .replace(/;\s*Secure\s*(?=;|$)/gi, '')
  }
  else {
    result = result.replace(/;\s*Secure\s*(?=;|$)/gi, '')
    if (!/SameSite=/i.test(result)) {
      result += '; SameSite=Lax'
    }
  }

  return result
}
