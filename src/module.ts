import type { Query } from '@directus/sdk'
import type { ImageModifiers, ImageProviders } from '@nuxt/image'
import type { InlinePreset } from 'unimport'

import * as directusSdk from '@directus/sdk'
import { addComponentsDir, addImportsDir, addImportsSources, addPlugin, addRouteMiddleware, addServerHandler, addTypeTemplate, createResolver, defineNuxtModule, hasNuxtModule, installModule, tryResolveModule, useLogger } from '@nuxt/kit'
import { colors } from 'consola/utils'
import { defu } from 'defu'
import { joinURL } from 'ufo'
import { name, version } from '../package.json'
import { generateTypesFromDirectus } from './runtime/types'
import { useUrl } from './runtime/utils'

export type DirectusUrl = string | { client: string, server: string }
export type ReadMeFields = Query<DirectusSchema, DirectusSchema['directus_users']>['fields']

export interface ModuleOptions {
  /**
   * Directus API URL
   * Can be a string for a single URL, or an object with `client` and `server` for split URLs.
   * Use the object form in Docker/K8s where SSR needs an internal hostname.
   * @default process.env.DIRECTUS_URL
   * @example 'https://cms.example.com'
   * @example { client: 'https://cms.example.com', server: 'http://cms_directus:8055' }
   */
  url: DirectusUrl

  /**
   * Development proxy configuration
   * When enabled, creates a proxy at /directus that forwards to your Directus URL
   * This solves CORS and cookie issues in development
   * @default { enabled: true, path: '/directus', wsPath: '/directus-ws' } in dev mode
   * @type boolean | { enabled?: boolean, path?: string, wsPath?: string }
   */
  devProxy?: boolean | {
    /**
     * Enable the development proxy
     * @default true in dev mode, false in production
     */
    enabled?: boolean
    /**
     * Proxy path (where the proxy will be mounted)
     * @default '/directus'
     */
    path?: string
    /**
     * WebSocket proxy path (for realtime connections)
     * @default '/directus-ws'
     */
    wsPath?: string
  }

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
    devProxy: undefined, // Will be set based on dev mode in setup
    adminToken: import.meta.env.DIRECTUS_ADMIN_TOKEN ?? '',
    devtools: true,
    visualEditor: true,
    image: true,
    types: {
      enabled: true,
      prefix: '',
    },
    autoImportSdk: true,
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
    // Resolve client and server URLs from the url option
    const clientUrl = typeof options.url === 'string' ? options.url : options.url?.client
    const serverUrl = typeof options.url === 'string' ? options.url : options.url?.server

    if (!clientUrl) {
      logger.warn('No Directus URL found at build time. Set it in config options, .env file as DIRECTUS_URL, or at runtime via NUXT_PUBLIC_DIRECTUS_URL.')
    }

    const resolver = createResolver(import.meta.url)

    // Helper function to register modules
    async function registerModule(name: string, key: string, moduleOptions: Record<string, any>) {
      if (!hasNuxtModule(name)) {
        await installModule(name, defu((nuxtApp.options as any)[key], moduleOptions))
      }
      else {
        (nuxtApp.options as any)[key] = defu((nuxtApp.options as any)[key], moduleOptions)
      }
    }
    // set up array to send logs in messagebox
    const loggerMessage: string[] = []

    // Normalize devProxy options
    const devProxyConfig = typeof options.devProxy === 'boolean'
      ? { enabled: options.devProxy }
      : { ...options.devProxy }

    // Server URL used for proxy target, type gen, devtools (all server-side operations)
    const directusUrl = serverUrl || clientUrl

    const devProxyEnabled = devProxyConfig.enabled ?? nuxtApp.options.dev
    const devProxyPath = devProxyConfig.path ?? '/directus'
    // Use a separate route for WebSocket proxy to avoid conflicts with the HTTP handler
    const wsProxyPath = devProxyConfig.wsPath ?? `${devProxyPath}-ws`
    const wsTarget = joinURL(directusUrl, 'websocket')

    // Set up development proxy if enabled and in dev mode
    if (devProxyEnabled && nuxtApp.options.dev) {
      loggerMessage.push(`🌐 Development Proxy Mode Enabled:`)
      loggerMessage.push(`  - URL${colors.dim(` ${devProxyPath}`)} proxies ${colors.underline(colors.green(`${directusUrl}`))}`)
      loggerMessage.push(`  - WS URL${colors.dim(` ${wsProxyPath}`)} proxies ${colors.underline(colors.green(`${wsTarget}`))}`, '')

      // Configure WebSocket proxy for realtime support (WebSocket only)
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
      proxy.on('error', (err: any, _req: any, socket: any) => {
        logger.error(`WebSocket proxy error:`, err.message)
        if (socket && !socket.destroyed) {
          socket.end()
        }
      })

      proxy.on('proxyReqWs', (proxyReq: any, req: any, _socket: any) => {
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
          nuxtApp.server.upgrade = (req: any, socket: any, head: any) => {
            // Check if this is our WebSocket proxy route
            if (req.url?.startsWith(wsProxyPath)) {
              try {
                proxy.ws(req, socket, head)
              }
              catch (err: any) {
                logger.error('WebSocket proxy error:', err.message)
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

      // Add HTTP handler for regular requests
      addServerHandler({
        route: `${devProxyPath}/**`,
        handler: resolver.resolve('./runtime/server/routes/directus'),
      })

      // Store normalized devProxy config for runtime use
      options.devProxy = {
        enabled: true,
        path: devProxyPath,
        wsPath: wsProxyPath,
      }
    }
    else if (!nuxtApp.options.dev) {
      loggerMessage.push(`🌐 Production Mode:`, `  - SDK connects directly to ${colors.dim(`${directusUrl}`)}`, '')
      options.devProxy = false
    }

    (options as any).directusUrl = clientUrl
    ; (options as any).serverDirectusUrl = serverUrl || clientUrl

    nuxtApp.options.runtimeConfig[configKey] = options as any
    nuxtApp.options.runtimeConfig.public = nuxtApp.options.runtimeConfig.public || {}
    nuxtApp.options.runtimeConfig.public[configKey] = defu(nuxtApp.options.runtimeConfig.public[configKey] as any, options)

    delete (nuxtApp.options.runtimeConfig.public[configKey] as any).adminToken
    delete (nuxtApp.options.runtimeConfig.public[configKey] as any).serverDirectusUrl

    // Register @nuxt/image with Directus provider
    const imageConfig = typeof options.image === 'boolean' ? { enabled: options.image } : options.image
    const imageEnabled = imageConfig?.enabled ?? true

    const hasNuxtImage = imageEnabled && (hasNuxtModule('@nuxt/image') || await tryResolveModule('@nuxt/image', new URL(import.meta.url)))

    if (hasNuxtImage) {
      const { setDefaultProvider, modifiers } = imageConfig || {}

      const imageBaseUrl = devProxyEnabled
        ? `${devProxyPath}/assets`
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
      loggerMessage.push('📝 Visual Editor Components Added', '')
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

    // Auto-import every function @directus/sdk exports, except for the
    // following which the module either wraps, provides a composable for,
    // or explicitly does not support. Users can still import them manually
    // from '@directus/sdk' when they have a deliberate reason to.
    //
    // Keep MANUAL_IMPORT_ONLY in sync with docs/api/composables/index.md.
    const MANUAL_IMPORT_ONLY = new Set([
      // Client construction — useDirectus() returns a fully-configured
      // singleton with auth, rest, realtime, and SSR cookie forwarding.
      'createDirectus',
      'rest',
      'realtime',
      'staticToken',
      'authentication',
      // Auth internals — use the auth composables (useDirectusAuth, etc.)
      'auth',
      'getAuthEndpoint',
      // Storage primitive — use useDirectusStorage()
      'memoryStorage',
      // GraphQL — the module does not wrap or support GraphQL. Imported
      // manually to keep users' expectations explicit about what this
      // module covers.
      'graphql',
      'readGraphqlSdl',
    ])

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
          imports: Object.keys(directusSdk).filter(name =>
            typeof (directusSdk as Record<string, unknown>)[name] === 'function'
            && !MANUAL_IMPORT_ONLY.has(name)
            && !userExclude.has(name),
          ),
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
          'useServerDirectus',
          'useDirectusUrl',
          'useTokenDirectus',
        ],
      })
    })

    if (options.devtools) {
      loggerMessage.push(`📦 Directus added to Nuxt DevTools`, '')
      nuxtApp.hook('devtools:customTabs' as any, (iframeTabs: any) => {
        iframeTabs.push({
          name: 'directus',
          title: 'Directus',
          icon: 'simple-icons:directus',
          view: {
            type: 'iframe',
            src: useUrl(directusUrl, 'admin'),
          },
        })
      })
    }

    const typesEnabled = (typeof options.types === 'boolean' && options.types) || (options.types && options.types.enabled === true)
    const typesPrefix = typeof options.types === 'object' ? options.types.prefix ?? '' : ''

    if (typesEnabled) {
      loggerMessage.push('📋 Directus Type Generator Enabled')
      if (!options.adminToken) {
        loggerMessage.push(`  ${colors.bgRedBright(`${colors.red('⚑ ERROR:')} Unable to generate Types`)}`, `   Fix: Set adminToken in config or DIRECTUS_ADMIN_TOKEN in .env`)
      }
      else {
        try {
          const { typeString, logs } = await generateTypesFromDirectus(directusUrl, options.adminToken!, typesPrefix)
          loggerMessage.push(...logs)

          addTypeTemplate({
            filename: `types/${configKey}.d.ts`,
            getContents() {
              return typeString
            },
          }, { nitro: true, nuxt: true })

          if (logs.some(log => log.toLowerCase().includes('error'))) {
            throw new Error(`  ${colors.bgRedBright(`${colors.red('⚑ ERROR:')} TypeGenerator returned an error`)}`)
          }
          loggerMessage.push(`  - Directus Types saved successfully to ${colors.dim(`#build/types/${configKey}.d.ts`)}`)
        }
        catch (error) {
          loggerMessage.push(`${error instanceof Error ? error.message : String(error)}`, `  - Fallback DirectusSchema is being used ${colors.dim('(not recommended)')}`)
        }
      }
    }
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
