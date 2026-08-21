/**
 * Validate post-login redirect targets.
 * Allows same-origin path-only redirects; rejects schemes and //evil.com.
 */
export function isSafeRedirectPath(value: unknown): value is string {
  if (typeof value !== 'string' || !value)
    return false
  const path = value.startsWith('/') ? value : (() => {
    try {
      return decodeURIComponent(value)
    }
    catch {
      return ''
    }
  })()
  if (!path.startsWith('/') || path.startsWith('//'))
    return false
  if (path.includes('://') || path.includes('\\'))
    return false
  return true
}

export function resolveSafeRedirectPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value)
    return fallback
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  }
  catch {
    return fallback
  }
  return isSafeRedirectPath(decoded) ? decoded : fallback
}
