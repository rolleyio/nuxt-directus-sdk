import type { DirectusUser, Query } from '@directus/sdk'
import type { ImageModifiers, ImageProviders } from '@nuxt/image'
import type { InlinePreset } from 'unimport'

import * as directusSdk from '@directus/sdk'
import { addComponentsDir, addImports, addImportsDir, addImportsSources, addPlugin, addRouteMiddleware, addServerHandler, addTypeTemplate, createResolver, defineNuxtModule, hasNuxtModule, installModule, tryResolveModule, useLogger } from '@nuxt/kit'
import { colors } from 'consola/utils'
import { defu } from 'defu'
import { joinURL } from 'ufo'
import { readFileSync } from 'node:fs'
import { name, version } from '../package.json'
import { generateTypesFromDirectus } from './runtime/types'
import { useUrl } from './runtime/utils'
import { discoverSdkImports } from './sdk-imports'

export type DirectusUrl = string | { client: string, server: string }
export type ReadMeFields = Query<DirectusSchema, DirectusUser<DirectusSchema>>['fields']

/**
 * Shape of the `proxy` (and deprecated `devProxy`) module option.
 */
export type ProxyOption = boolean | {
  /**
   * Enable the proxy. Defaults to true in dev, false in production.
   * Explicitly setting `true` enables HTTP proxying in production too.
   */
  enabled?: boolean
  /**
   * HTTP proxy path (where the Nitro server handler is mounted).
   * @default '/directus'
   */
  path?: string
  /**
   * WebSocket proxy path (for realtime connections). Dev-mode only;
   * ignored in production builds.
   * @default '/directus-ws'
   */
  wsPath?: string
}

export interface ModuleOptions {
  /**
   * Directus API URL
   * Can be a string for a single URL, or an object with `client` and `server` for split URLs.
   * Use the object form in Docker/K8s where SSR needs an internal hostname.
   * @default process.env.DIRECTUS_URL
   * @example 'https://directus.example.com'
   * @example { client: 'https://directus.example.com', server: 'http://directus:8055' }
   */
  url: DirectusUrl

  /**
   * Proxy configuration. When enabled, creates a Nitro server handler at
   * `path` that forwards HTTP requests to your Directus URL. Useful for
   * cookie-scope (login on the same origin) and CORS workarounds.
   *
   * - Defaults to on in dev, off in production.
   * - Setting `true` (or `{ enabled: true }`) explicitly turns the HTTP
   *   proxy on in production too.
   * - The WebSocket proxy (for realtime) is dev-only; it relies on the
   *   dev-server's upgrade hook which doesn't exist in production builds.
   *   When the HTTP proxy is on in production, realtime connects directly
   *   to Directus, so realtime auth still requires same-domain cookies
   *   (or a public `realtimeAuthMode`).
   *
   * @default { enabled: <isDev>, path: '/directus', wsPath: '/directus-ws' (dev only) }
   * @type boolean | { enabled?: boolean, path?: string, wsPath?: string }
   */
  proxy?: ProxyOption

  /**
   * @deprecated Use `proxy` instead. `devProxy` will be removed in the next major release.
   */
  devProxy?: ProxyOption

  /**
   * Admin Auth Token used for generating types and server functions
   * @default process.env.DIRECTUS_ADMIN_TOKEN
   * @type string
   */
  adminToken?: string

  /**
   * Add Directus Admin in Nuxt Devtools
   * @default true
   */
  devtools?: boolean

  /**
   * Add Directus Visual Editor capabilities
   * @default true
   */
  visualEditor?: boolean

  /**
   * @nuxt/image integration
   * @default true
   */
  image?: boolean | {
    /**
     * Enable @nuxt/image integration
     * @default true
     */
    enabled?: boolean

    /**
     * Set Directus as the default provider for NuxtImg
     * @default false
     */
    setDefaultProvider?: boolean

    /**
     * Custom Directus provider configuration
     */
    directus?: ImageProviders['directus']

    /**
     * Default modifiers for Directus provider
     */
    modifiers?: ImageModifiers
  }

  /**
   * Auth options
   */
  auth?: {
    /**
     * Enable auth middleware
     * @default true
     * @type boolean
     */
    enabled?: boolean

    /**
     * Enable global auth middleware
     * @default false
     * @type boolean
     */
    enableGlobalAuthMiddleware?: boolean

    /**
     * Auto refresh tokens
     * @default true
     * @type boolean
     */
    autoRefresh?: boolean

    /**
     * Credentials mode for cross-domain requests
     * Set to 'include' when your frontend and backend are on different domains
     * @default 'include'
     * @type RequestCredentials
     */
    credentials?: RequestCredentials

    /**
     * Realtime/WebSocket authentication mode
     * @default 'handshake'
     * @type 'public' | 'handshake' | 'strict'
     */
    realtimeAuthMode?: 'public' | 'handshake' | 'strict'

    /**
     * ReadMe fields to fetch
     * @default []
     * @type ReadMeFields
     */
    readMeFields?: ReadMeFields

    redirect?: {
      /**
       * Redirect to home page after login
       * @default '/'
       */
      home?: string
      /**
       * Redirect to login when using auth middleware
       * @default '/auth/login'
       */
      login?: string
      /**
       * Redirect to home page page after logout
       * @default '/'
       */
      logout?: string
    }
  }

  types?: boolean | {
    /**
     * Enable type generation
     * @type boolean
     * @default true
     */
    enabled?: boolean
    /**
     * Prefix for custom collection types (does not affect DirectusSchema keys)
     * @type string
     * @default ''
     */
    prefix?: string
    /**
     * Collection names to include in the generated types. When non-empty,
     * only these collections (plus any they reference — see
     * `expandReferences`) are emitted. References to collections not in
     * the resolved set collapse to `string` (M2O) or `string[]` (O2M).
     *
     * Takes precedence over `exclude` if both are set.
     * @type string[]
     * @default []
     */
    include?: string[]
    /**
     * When `include` is set, also pull in any collections referenced by
     * the included collections (transitively). Follows M2O, O2M, and M2A.
     * No-op when `include` is empty.
     * @type boolean
     * @default true
     */
    expandReferences?: boolean
    /**
     * Collection names to exclude from generated types.
     * References to excluded collections are rewritten to `string` (M2O) or
     * `string[]` (O2M) so the generated types stay resolvable.
     * @type string[]
     * @default []
     */
    exclude?: string[]
    /**
     * When true, emit per-target warnings listing every field whose
     * reference was collapsed to `string`/`string[]`. Field lists are
     * capped at 5 per collection.
     * @type boolean
     * @default false
     */
    verbose?: boolean
  }

  /**
   * Pinia Colada integration. When `@pinia/colada` is installed in your
   * project, the module auto-imports cached query composables
   * (`useDirectusItemsQuery`, `useDirectusItemQuery`,
   * `useDirectusSingletonQuery`) backed by the Colada query cache, and
   * registers `@pinia/nuxt` / `@pinia/colada-nuxt` if they are not already
   * in your modules. Set to `false` to disable even when installed.
   *
   * Router data loaders are separate and opt-in: see
   * `experimental.dataLoaders`.
   *
   * @default true
   */
  piniaColada?: boolean

  /**
   * Experimental features. Everything in here builds on upstream APIs that
   * may change between releases, so each feature is off by default and must
   * be enabled explicitly.
   */
  experimental?: {
    /**
     * vue-router data loaders: auto-imports the `defineDirectusLoader()`
     * factory and registers the `DataLoaderPlugin`. Loaders run during
     * navigation so page data is ready on first paint.
     *
     * Requires `@pinia/colada` (see `piniaColada`) and vue-router with the
     * `experimental` exports. Experimental because vue-router's data loader
     * API is itself experimental.
     *
     * `true` or an options object enables it.
     *
     * @default false
     */
    dataLoaders?: boolean | {
      /**
       * Register the vue-router `DataLoaderPlugin`. Disable if your app
       * installs the plugin itself.
       * @default true
       */
      registerPlugin?: boolean
    }
  }

  /**
   * Auto-import functions from `@directus/sdk`.
   *
   * - `true` (default) — auto-imports every SDK function except those wrapped by
   *   this module (e.g. `createDirectus`, `rest`, `authentication`) or explicitly
   *   unsupported (e.g. `graphql`, `readGraphqlSdl`).
   * - `false` — disables auto-imports entirely. You import from `@directus/sdk`
   *   manually wherever you use SDK functions.
   * - `{ exclude: [...] }` — auto-imports with additional functions excluded.
   *   Useful if an SDK function name collides with something else in your app.
   *
   * @default true
   */
  autoImportSdk?: boolean | {
    /**
     * Additional SDK function names to exclude from auto-import.
     * Added on top of the module's built-in exclusions.
     */
    exclude?: string[]
  }
}

const configKey = 'directus'
const logger = useLogger('nuxt-directus-sdk')

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey,
    compatibility: {
      nuxt: '^4.0.0',
    },
  },
  defaults: {
    url: import.meta.env.DIRECTUS_URL ?? '',
    proxy: undefined, // Resolved in setup based on dev mode.
    devProxy: undefined,
    adminToken: import.meta.env.DIRECTUS_ADMIN_TOKEN ?? '',
    devtools: true,
    visualEditor: true,
    image: true,
    types: {
      enabled: true,
      prefix: '',
    },
    autoImportSdk: true,
    piniaColada: true,
    experimental: {
      dataLoaders: false,
    },
    auth: {
      enabled: true,
      enableGlobalAuthMiddleware: false,
      autoRefresh: true,
      credentials: 'include',
      realtimeAuthMode: 'public',
      readMeFields: [],
      redirect: {
        home: '/',
        login: '/auth/login',
        logout: '/',
      },
    },
  },
  async setup(options, nuxtApp) {
    // set up array to send logs in messagebox
    const loggerMessage: string[] = []

    // Resolve client and server URLs from the url option
    const clientUrl = typeof options.url === 'string' ? options.url : options.url?.client
    const serverUrl = typeof options.url === 'string' ? options.url : options.url?.server

    if (!clientUrl) {
      loggerMessage.push(`⚠️ No Directus URL found at build time:`, `  - Set it in config options, .env file as DIRECTUS_URL or at runtime via NUXT_PUBLIC_DIRECTUS_URL.`, '')
    }

    const resolver = createResolver(import.meta.url)
    const fallbackTypeContent = readFileSync(resolver.resolve('./runtime/types/fallback.d.ts'), 'utf-8')

    // Helper function to register modules
    // NuxtOptions has no public index signature for module config keys.
    async function registerModule(name: string, key: string, moduleOptions: Record<string, unknown>) {
      if (!hasNuxtModule(name)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await installModule(name, defu((nuxtApp.options as any)[key], moduleOptions))
      }
      else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(nuxtApp.options as any)[key] = defu((nuxtApp.options as any)[key], moduleOptions)
      }
    }

    // Resolve the proxy option. `proxy` is the canonical name; `devProxy` is
    // kept as a deprecated alias.
    //  - If `proxy` is set, use it (and warn if `devProxy` was also set).
    //  - If only `devProxy` is set, hoist it and emit a deprecation warning.
    //  - If neither is set, fall through to the default (on in dev, off in prod).
    if (options.proxy !== undefined && options.devProxy !== undefined) {
      logger.warn(
        'Both `proxy` and `devProxy` are set in directus module config. `proxy` wins; `devProxy` is ignored. Remove the deprecated `devProxy` entry.',
      )
    }
    else if (options.proxy === undefined && options.devProxy !== undefined) {
      logger.warn(
        '`directus.devProxy` is deprecated and will be removed in a future major release. Rename it to `directus.proxy`.',
      )
      options.proxy = options.devProxy
    }
    // Clear the deprecated field so it doesn't leak into runtimeConfig.
    options.devProxy = undefined

    // Normalize the resolved proxy option into a config object.
    const proxyConfig = typeof options.proxy === 'boolean'
      ? { enabled: options.proxy }
      : { ...options.proxy }

    // Server URL used for proxy target, type gen, devtools (all server-side operations)
    const directusUrl = serverUrl || clientUrl

    const proxyEnabled = proxyConfig.enabled ?? nuxtApp.options.dev
    const proxyPath = proxyConfig.path ?? '/directus'
    // Use a separate route for WebSocket proxy to avoid conflicts with the HTTP handler
    const wsProxyPath = proxyConfig.wsPath ?? `${proxyPath}-ws`
    const wsTarget = joinURL(directusUrl, 'websocket')

    // Proxy resolution:
    // - HTTP proxy: works in dev and production (Nitro server handler)
    // - WebSocket proxy: dev only; the upgrade hook below relies on
    //   nuxtApp.server.upgrade, which exists only in the dev orchestrator.
    //
    // Default (proxyConfig.enabled === undefined): on in dev, off in prod.
    // Explicit `true`: on in both (HTTP only in prod, with a warning).
    // Explicit `false`: off in both.
    const isDev = nuxtApp.options.dev

    if (proxyEnabled) {
      const headerLabel = isDev ? '🌐 Development Proxy Mode Enabled:' : '🌐 Proxy Mode Enabled (production):'
      loggerMessage.push(headerLabel)
      loggerMessage.push(`  - URL${colors.dim(` ${proxyPath}`)} proxies ${colors.underline(colors.green(`${directusUrl}`))}`)

      // HTTP proxy server handler; works in dev and production builds.
      addServerHandler({
        route: `${proxyPath}/**`,
        handler: resolver.resolve('./runtime/server/routes/directus'),
      })

      if (isDev) {
        loggerMessage.push(`  - WS URL${colors.dim(` ${wsProxyPath}`)} proxies ${colors.underline(colors.green(`${wsTarget}`))}`, '')

        // Configure WebSocket proxy for realtime support (WebSocket only).
        // Nitro's devProxy is dev-server only; intentionally skipped in prod.
        nuxtApp.options.nitro = nuxtApp.options.nitro || {}
        nuxtApp.options.nitro.devProxy = nuxtApp.options.nitro.devProxy || {}

        nuxtApp.options.nitro.devProxy[wsProxyPath] = {
          target: directusUrl,
          changeOrigin: true,
          ws: true,
        }

        // Set up WebSocket proxy handler using http-proxy
        // Point to the base Directus URL, we'll rewrite the path in the proxy
        const httpProxy = await import('http-proxy')
        const proxy = httpProxy.default.createProxyServer({
          target: directusUrl,
          changeOrigin: true,
          ws: true,
          secure: false, // Allow self-signed certificates
        })

        // Add error handling to the proxy
        proxy.on('error', (err, _req, socket) => {
          logger.error(`WebSocket proxy error:`, err.message)
          if (socket && !socket.destroyed) {
            socket.end()
          }
        })

        proxy.on('proxyReqWs', (proxyReq, req, _socket) => {
          // Rewrite the path from /_directus-ws to /websocket
          proxyReq.path = '/websocket'

          // Forward cookies for authentication
          if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie)
          }
        })

        nuxtApp.hook('ready', () => {
          const originalUpgrade = nuxtApp.server?.upgrade

          // Replace the nuxt server upgrade handler with our WebSocket proxy
          if (nuxtApp.server) {
            // nuxtApp.server.upgrade is not part of Nuxt's public type surface.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nuxtApp.server.upgrade = (req: any, socket: any, head: any) => {
              // Check if this is our WebSocket proxy route
              if (req.url?.startsWith(wsProxyPath)) {
                try {
                  proxy.ws(req, socket, head)
                }
                catch (error: unknown) {
                  logger.error('WebSocket proxy error:', error instanceof Error ? error.message : String(error))
                  if (!socket.destroyed) {
                    socket.destroy()
                  }
                }
              }
              else if (originalUpgrade) {
                return originalUpgrade(req, socket, head)
              }
              else if (!socket.destroyed) {
                socket.destroy()
              }
            }
          }
        })
      }
      else {
        loggerMessage.push(`  - ${colors.yellow('WebSocket proxy is disabled in production')}; connect realtime directly to ${colors.dim(`${wsTarget}`)}`, '')
      }

      // Store normalized proxy config for runtime use.
      // wsPath is only meaningful when the WS proxy is actually registered (dev),
      // so leave it undefined in production builds.
      options.proxy = {
        enabled: true,
        path: proxyPath,
        wsPath: isDev ? wsProxyPath : undefined,
      }
    }
    else if (!isDev && directusUrl) {
      loggerMessage.push(`🌐 Production Mode:`, `  - SDK connects directly to ${colors.dim(`${directusUrl}`)}`, '')
      options.proxy = false
    }

    // directusUrl/serverDirectusUrl are injected onto options so Nuxt's type
    // generation picks them up in runtimeConfig — ModuleOptions has no typed slot for them.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(options as any).directusUrl = clientUrl
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(options as any).serverDirectusUrl = serverUrl || clientUrl

    // runtimeConfig is indexed by the module configKey which is not statically known.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nuxtApp.options.runtimeConfig[configKey] = options as any
    nuxtApp.options.runtimeConfig.public = nuxtApp.options.runtimeConfig.public || {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nuxtApp.options.runtimeConfig.public[configKey] = defu(nuxtApp.options.runtimeConfig.public[configKey] as any, options)

    // Strip server-only fields before they reach the public runtime config.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (nuxtApp.options.runtimeConfig.public[configKey] as any).adminToken
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (nuxtApp.options.runtimeConfig.public[configKey] as any).serverDirectusUrl
    // Strip the deprecated alias so runtime reads from `proxy` only.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (nuxtApp.options.runtimeConfig.public[configKey] as any).devProxy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (nuxtApp.options.runtimeConfig[configKey] as any).devProxy

    // Register @nuxt/image with Directus provider
    const imageConfig = typeof options.image === 'boolean' ? { enabled: options.image } : options.image
    const imageEnabled = imageConfig?.enabled ?? true

    const hasNuxtImage = imageEnabled && (hasNuxtModule('@nuxt/image') || await tryResolveModule('@nuxt/image', new URL(import.meta.url)))

    if (hasNuxtImage) {
      const { setDefaultProvider, modifiers } = imageConfig || {}

      const imageBaseUrl = proxyEnabled
        ? `${proxyPath}/assets`
        : useUrl(clientUrl, 'assets')

      await registerModule('@nuxt/image', 'image', {
        // Set default provider if requested
        ...(setDefaultProvider && { provider: 'directus' }),
        // Configure Directus provider
        directus: {
          baseURL: imageBaseUrl,
          modifiers,
        },
      })
      loggerMessage.push('📷 Nuxt/Image default provider is set to Directus', '')
    }

    // Add plugin to load user before bootstrap
    addPlugin(resolver.resolve('./runtime/plugin'))

    // Add visual editor plugin and components only when enabled AND @directus/visual-editing is installed
    const hasVisualEditing = options.visualEditor && await tryResolveModule('@directus/visual-editing', new URL(import.meta.url))

    // Only register visual editor components when enabled and @directus/visual-editing is installed
    if (hasVisualEditing) {
      addPlugin(resolver.resolve('./runtime/plugins/visual-editor.client'))
      addComponentsDir({
        path: resolver.resolve('./runtime/components'),
        pathPrefix: false,
        prefix: '',
        global: true,
      })
      loggerMessage.push('📝 Visual Editor Component Added', '')
    }

    // Add route middleware
    if (options.auth?.enableGlobalAuthMiddleware) {
      loggerMessage.push('🔒 Auth middleware installed globally.', '')
    }
    addRouteMiddleware({
      name: 'auth',
      path: resolver.resolve('./runtime/middleware/auth'),
      global: options.auth?.enableGlobalAuthMiddleware,
    })

    addRouteMiddleware({
      name: 'guest',
      path: resolver.resolve('./runtime/middleware/guest'),
    })

    // Add composables
    addImportsDir(resolver.resolve('./runtime/composables'))

    // Pinia Colada integration: cached query composables, auto-enabled when
    // @pinia/colada is installed (opt out with piniaColada: false). Router
    // data loaders build on vue-router's experimental API and are opt-in
    // via experimental.dataLoaders.
    const coladaWanted = options.piniaColada !== false
    const modulesDir = nuxtApp.options.modulesDir
    const coladaEntry = coladaWanted ? await tryResolveModule('@pinia/colada', modulesDir) : undefined

    const dataLoadersOption = options.experimental?.dataLoaders ?? false
    const dataLoadersConfig = typeof dataLoadersOption === 'boolean' ? { enabled: dataLoadersOption } : { enabled: true, ...dataLoadersOption }

    if (dataLoadersConfig.enabled && !coladaEntry) {
      loggerMessage.push(
        `🍹 ${colors.yellow('experimental.dataLoaders is enabled but Pinia Colada is unavailable')}`,
        coladaWanted
          ? `  - Install @pinia/colada (plus @pinia/colada-nuxt, @pinia/nuxt and pinia) to use data loaders`
          : `  - Remove piniaColada: false to use data loaders`,
        '',
      )
    }

    if (coladaEntry) {
      const hasPiniaNuxt = hasNuxtModule('@pinia/nuxt') || !!(await tryResolveModule('@pinia/nuxt', modulesDir))

      if (!hasPiniaNuxt) {
        loggerMessage.push(`🍹 ${colors.yellow('@pinia/colada found but @pinia/nuxt is missing')}`, `  - Install @pinia/nuxt to enable the Directus query composables`, '')
      }
      else {
        await registerModule('@pinia/nuxt', 'pinia', {})

        // Pin a single @pinia/colada instance. The module's runtime imports
        // it as a peer, which in workspace/layer setups can resolve to a
        // second copy next to the module instead of the app's copy that the
        // PiniaColada plugin installed (two copies = "no active Pinia"
        // errors from the query cache). The alias applies to Vite and Nitro,
        // including externalized SSR resolution in dev.
        nuxtApp.options.alias['@pinia/colada'] = coladaEntry

        if (hasNuxtModule('@pinia/colada-nuxt') || await tryResolveModule('@pinia/colada-nuxt', modulesDir)) {
          await registerModule('@pinia/colada-nuxt', 'colada', {})
        }
        else {
          loggerMessage.push(`  - ${colors.yellow('Install @pinia/colada-nuxt for SSR cache hydration')} (queries will refetch on the client without it)`)
        }

        addImports(['useDirectusItemsQuery', 'useDirectusItemQuery', 'useDirectusSingletonQuery'].map(name => ({
          name,
          from: resolver.resolve('./runtime/colada/queries'),
        })))
        loggerMessage.push('🍹 Pinia Colada detected: useDirectusItemsQuery, useDirectusItemQuery and useDirectusSingletonQuery added')

        // Data loaders need the experimental vue-router exports (Nuxt >= 4.2)
        // and the pages router to exist.
        const pagesOption = nuxtApp.options.pages as boolean | { enabled?: boolean } | undefined
        const pagesEnabled = typeof pagesOption === 'object' ? pagesOption?.enabled !== false : pagesOption !== false
        const hasExperimentalRouter = !!(await tryResolveModule('vue-router/experimental/pinia-colada', modulesDir))

        if (dataLoadersConfig.enabled && pagesEnabled && hasExperimentalRouter) {
          if (dataLoadersConfig.registerPlugin ?? true) {
            addPlugin(resolver.resolve('./runtime/colada/data-loaders'))
          }
          addImports([{
            name: 'defineDirectusLoader',
            from: resolver.resolve('./runtime/colada/loaders'),
          }])
          loggerMessage.push('  - Experimental data loaders enabled: defineDirectusLoader added', '')
        }
        else if (dataLoadersConfig.enabled && !hasExperimentalRouter) {
          loggerMessage.push(`  - ${colors.yellow('Data loaders skipped: vue-router experimental exports not found')} (upgrade Nuxt for defineDirectusLoader)`, '')
        }
        else {
          loggerMessage.push('')
        }
      }
    }

    // autoImportSdk=false disables auto-imports entirely; the { exclude }
    // shape adds user-provided names on top of the built-in exclusions.
    const autoImportSdk = options.autoImportSdk ?? true
    const userExclude = new Set(
      typeof autoImportSdk === 'object' && autoImportSdk?.exclude
        ? autoImportSdk.exclude
        : [],
    )

    const directusSdkImports: InlinePreset | null = autoImportSdk === false
      ? null
      : {
          from: '@directus/sdk',
          imports: discoverSdkImports(directusSdk as Record<string, unknown>, userExclude),
        }

    if (directusSdkImports) {
      addImportsSources(directusSdkImports)
    }

    nuxtApp.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}

      nitroConfig.imports = nitroConfig.imports || {}
      nitroConfig.imports.presets = nitroConfig.imports.presets || []
      if (directusSdkImports) {
        nitroConfig.imports.presets.push(directusSdkImports)
      }
      nitroConfig.imports.presets.push({
        from: resolver.resolve('./runtime/server/services'),
        imports: [
          'getDirectusSessionToken',
          'useAdminDirectus',
          'useSessionDirectus',
          'useDirectusUrl',
          'useTokenDirectus',
        ],
      })
    })

    if (options.devtools) {
      loggerMessage.push(`📦 Directus added to Nuxt DevTools`, '')
      // 'devtools:customTabs' is a Nuxt DevTools hook not declared in core Nuxt hook types.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nuxtApp.hook('devtools:customTabs' as any, (iframeTabs: any) => {
        iframeTabs.push({
          name: 'directus',
          title: 'Directus',
          icon: 'simple-icons:directus',
          view: {
            type: 'iframe',
            // Browser must open the public client URL, not an internal Docker/K8s hostname.
            src: useUrl(clientUrl || directusUrl, 'admin'),
          },
        })
      })
    }

    const typesEnabled = (typeof options.types === 'boolean' && options.types) || (options.types && options.types.enabled === true)
    const typesPrefix = typeof options.types === 'object' ? options.types.prefix ?? '' : ''
    const typesInclude = typeof options.types === 'object' ? options.types.include ?? [] : []
    const typesExpandReferences = typeof options.types === 'object' ? options.types.expandReferences ?? true : true
    const typesExclude = typeof options.types === 'object' ? options.types.exclude ?? [] : []
    const typesVerbose = typeof options.types === 'object' ? options.types.verbose ?? false : false

    let typeString = fallbackTypeContent

    if (typesEnabled) {
      loggerMessage.push('📋 Directus Type Generator Enabled')

      if (!options.adminToken) {
        loggerMessage.push(`  ${colors.bgRedBright(`${colors.red('⚑ ERROR:')} Unable to generate Types`)}`, `   Fix: Set adminToken in config or DIRECTUS_ADMIN_TOKEN in .env`, `  - Fallback DirectusSchema is being used ${colors.dim('(not recommended)')}`)
      }
      else {
        try {
          const { typeString: generated, logs } = await generateTypesFromDirectus(directusUrl, options.adminToken!, typesPrefix, {
            include: typesInclude,
            expandReferences: typesExpandReferences,
            exclude: typesExclude,
            verbose: typesVerbose,
          })
          loggerMessage.push(...logs)

          if (generated !== null) {
            typeString = generated
            if (!logs.some(log => log.toLowerCase().includes('error'))) {
              loggerMessage.push(`  - Directus Types saved successfully to ${colors.dim(`#build/types/${configKey}.d.ts`)}`)
            }
            else {
              throw new Error(`  ${colors.bgRedBright(`${colors.red('⚑ ERROR:')} TypeGenerator returned an error`)}`)
            }
          }
          else {
            loggerMessage.push(`  - Fallback DirectusSchema is being used ${colors.dim('(not recommended)')}`)
          }
        }
        catch (error) {
          typeString = fallbackTypeContent
          loggerMessage.push(`${error instanceof Error ? error.message : String(error)}`, `  - Fallback DirectusSchema is being used ${colors.dim('(not recommended)')}`)
        }
      }
    }

    addTypeTemplate({
      filename: `types/${configKey}.d.ts`,
      getContents() {
        return typeString
      },
    }, { nitro: true, nuxt: true })
    logger.box({ message: loggerMessage.join('\n'), title: `${colors.magenta(`Nuxt Directus SDK Version: ${colors.magentaBright(`${version}`)}`)}`, style: { padding: 3, borderColor: 'magenta', borderStyle: 'double-single-rounded' } })
  },
})

interface NuxtDirectusModuleOptions extends ModuleOptions {
  directusUrl: string
  serverDirectusUrl: string
  wsProxyUrl?: string
}

declare module '@nuxt/schema' {
  interface ConfigSchema {
    directus?: NuxtDirectusModuleOptions
    publicRuntimeConfig?: {
      directus?: Omit<NuxtDirectusModuleOptions, 'adminToken'>
    }
  }
}
