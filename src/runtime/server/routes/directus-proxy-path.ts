export type ProxyConfig = boolean | { enabled?: boolean, path?: string, wsPath?: string }

export function resolveProxyPath(proxy: ProxyConfig | undefined): string {
  return (typeof proxy === 'object' && proxy.path) || '/directus'
}

export function stripProxyPrefix(pathname: string, proxyPath: string): string {
  return pathname.startsWith(proxyPath) ? pathname.slice(proxyPath.length) : pathname
}
