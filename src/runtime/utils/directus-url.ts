export function resolvePublicDirectusUrl(config: {
  url?: string | { client?: string }
  directusUrl?: string
}): string {
  const runtimeUrl = typeof config.url === 'string'
    ? config.url
    : config.url?.client

  return runtimeUrl || config.directusUrl || ''
}
