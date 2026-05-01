export interface RuntimeConfigOverrides {
  url?: string | { client: string, server: string }
  directusUrl?: string
  serverDirectusUrl?: string
  devProxy?: boolean | { enabled: boolean, path?: string, wsPath?: string }
}

export function makeRuntimeConfig(overrides: RuntimeConfigOverrides) {
  return {
    public: {
      directus: {
        url: overrides.url ?? 'https://public.example.com',
        directusUrl: overrides.directusUrl,
        devProxy: overrides.devProxy ?? false,
      },
    },
    directus: {
      serverDirectusUrl: overrides.serverDirectusUrl,
    },
  }
}
