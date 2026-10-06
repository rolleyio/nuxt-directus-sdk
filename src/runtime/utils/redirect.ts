/**
 * Validate post-login redirect targets.
 * Allows same-origin path-only redirects; rejects schemes and //evil.com.
 */
export function isSafeRedirectPath(value: unknown): value is string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//'))
    return false
  if (value.includes('://') || value.includes('\\'))
    return false
  return true
}

export function resolveSafeRedirectPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value)
    return fallback
  let decoded: string
  try {
    decoded = decodeURIComponent(value)
  }
  catch {
    return fallback
  }
  return isSafeRedirectPath(decoded) ? decoded : fallback
}
