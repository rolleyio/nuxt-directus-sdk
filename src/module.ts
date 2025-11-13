import type { Query } from '@directus/sdk'
import type { ImportPresetWithDeprecation } from '@nuxt/schema'

import { addComponentsDir, addImportsDir, addImportsSources, addPlugin, addRouteMiddleware, addServerHandler, addTypeTemplate, createResolver, defineNuxtModule, installModule, useLogger } from '@nuxt/kit'
import { defu } from 'defu'
import { joinURL } from 'ufo'
import { name, version } from '../package.json'
import { generateTypes } from './runtime/types'
import { useUrl } from './runtime/utils'

export interface ModuleOptions {
  /**
   * Directus API URL
   * @default process.env.DIRECTUS_URL
   * @type string
   */
  url: string

  /**
   * Development proxy configuration
   * When enabled, creates a proxy at /directus that forwards to your Directus URL
   * This solves CORS and cookie issues in development
   * @default { enabled: true, path: '/directus' } in dev mode
   * @type boolean | { enabled?: boolean, path?: string }
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
  }

  /**
   * Admin Auth Token used for generating types and server functions
   * @default process.env.DIRECTUS_ADMIN_TOKEN
   * @type string
   */
  adminToken?: string

  /**
   * Add Directus Admin in Nuxt Devtools
   *
   * @default true
   */
  devtools?: boolean

  /**
   * Add Directus Visual Editor capabilities
   *
   * @default true
   */
  visualEditor?: boolean

  /**
   * Auth options
   */
  auth?: {
    /**
     * Enable auth middleware
     * @default true
     * @type boolean
     *
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
     * @type Query<DirectusSchema, DirectusSchema['directus_users']>['fields']
     */
    readMeFields?: Query<DirectusSchema, DirectusSchema['directus_users']>['fields']

    redirect?: {
      /**
       * Redirect to home page after login
       * @default '/home'
       */
      home?: string
      /**
       * Redirect to login page after logout
       * @default '/auth/login'
       */
      login?: string
      /**
       * Redirect to login page after logout
       * @default '/auth/login'
       */
      logout?: string
    }
  }

  types?: {
    /**
     * Generate types for your Directus instance
     * @type boolean
     * @default true
     */
    enabled?: boolean
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
    types: {
      enabled: true,
      prefix: '',
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
        login: '/account/login',
        logout: '/',
      },
    },
  },
  async setup(options, nuxtApp) {
    if (!options.url) {
      logger.error('nuxt-directus-sdk requires a url to your Directus instance, set it in the config options or .env file as DIRECTUS_URL')
      return
    }

    const resolver = createResolver(import.meta.url)

    // Normalize devProxy options
    const devProxyConfig = typeof options.devProxy === 'boolean'
      ? { enabled: options.devProxy }
      : { ...options.devProxy }

    // Default values
    const devProxyEnabled = devProxyConfig.enabled ?? nuxtApp.options.dev
    const devProxyPath = devProxyConfig.path ?? '/directus'

    // Store the original URL for type generation and server-side use
    const directusUrl = options.url

    logger.info(`Nuxt Directus SDK Version: ${version}`)

    // Set up development proxy if enabled and in dev mode
    if (devProxyEnabled && nuxtApp.options.dev) {
      // Get the dev server configuration from Nuxt
      // devServer.url is automatically populated by Nuxt after the server starts,
      // but we may need to construct it from host/port during module setup
      const devServerUrl = nuxtApp.options.devServer?.url
      const devPort = nuxtApp.options.devServer?.port ?? 3000
      const devHost = nuxtApp.options.devServer?.host ?? 'localhost'
      const baseUrl = devServerUrl ?? `http://${devHost}:${devPort}`
      const proxyUrl = `${baseUrl}${devProxyPath}/`

      // Use a separate route for WebSocket proxy to avoid conflicts with the HTTP handler
      const wsProxyPath = `${devProxyPath}-ws`
      const wsTarget = joinURL(directusUrl, 'websocket')

      logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      logger.info(`🔄 Directus Development Proxy Enabled`)
      logger.info(`   Proxy path: ${devProxyPath}`)
      logger.info(`   Forwarding to: ${directusUrl}`)
      logger.info(`   Local URL: ${proxyUrl}`)
      logger.info(`   WebSocket proxy path: ${wsProxyPath}`)
      logger.info(`   WebSocket target: ${wsTarget}`)
      logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

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

      // Update the URL to use the proxy for runtime requests
      options.url = proxyUrl

      // Store the WebSocket proxy path for client use
      ;(options as any).wsProxyUrl = joinURL(baseUrl, wsProxyPath)
    }
    else if (!nuxtApp.options.dev) {
      logger.info(`🌐 Production mode: Connecting directly to ${directusUrl}`)
    }

    (options as any).directusUrl = directusUrl

    nuxtApp.options.runtimeConfig[configKey] = options as any
    nuxtApp.options.runtimeConfig.public = nuxtApp.options.runtimeConfig.public || {}
    nuxtApp.options.runtimeConfig.public[configKey] = defu(nuxtApp.options.runtimeConfig.public[configKey] as any, options)

    delete (nuxtApp.options.runtimeConfig.public[configKey] as any).adminToken

    await installModule('@nuxt/image', {
      directus: {
        baseURL: useUrl(options.url, 'assets'),
      },
    })

    // Add plugin to load user before bootstrap
    addPlugin(resolver.resolve('./runtime/plugin'))

    // Add route middleware
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
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      pathPrefix: false,
      prefix: '',
      global: true,
    })

    const directusSdkImports: ImportPresetWithDeprecation = {
      from: '@directus/sdk',
      imports: [
        'aggregate',
        'generateUid',
        'createComment',
        'updateComment',
        'deleteComment',
        'createField',
        'createItem',
        'createItems',
        'deleteField',
        'deleteFile',
        'deleteFiles',
        'readActivities',
        'readActivity',
        'deleteItem',
        'deleteItems',
        'deleteUser',
        'deleteUsers',
        'importFile',
        'readCollection',
        'readCollections',
        'createCollection',
        'updateCollection',
        'deleteCollection',
        'readField',
        'readFieldsByCollection',
        'readFields',
        'readFile',
        'readFiles',
        'readItem',
        'readItems',
        'readSingleton',
        'readMe',
        'createUser',
        'createUsers',
        'readUser',
        'readUsers',
        'readProviders',
        'readFolder',
        'readFolders',
        'uploadFiles',
        'updateField',
        'updateFile',
        'updateFiles',
        'updateFolder',
        'updateFolders',
        'updateItem',
        'updateItems',
        'updateSingleton',
        'updateMe',
        'updateUser',
        'updateUsers',
        'withToken',
      ],
    }

    addImportsSources(directusSdkImports)

    nuxtApp.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}

      nitroConfig.imports = nitroConfig.imports || {}
      nitroConfig.imports.presets = nitroConfig.imports.presets || []
      nitroConfig.imports.presets.push(directusSdkImports)
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
      const adminUrl = useUrl(directusUrl, 'admin')
      logger.info(`Directus Admin URL: ${adminUrl}`)

      nuxtApp.hook('devtools:customTabs' as any, (iframeTabs: any) => {
        iframeTabs.push({
          name: 'directus',
          title: 'Directus',
          icon: 'simple-icons:directus',
          view: {
            type: 'iframe',
            src: adminUrl,
          },
        })
      })
    }
    else {
      logger.info('Set devtools to true to view the Directus admin panel from inside Nuxt Devtools')
    }

    if (options.types?.enabled) {
      if (!options.adminToken) {
        logger.warn('Directus types generation is disabled, set the admin token in the config or .env file as DIRECTUS_ADMIN_TOKEN')
      }
      else {
        try {
          // Generate types once and cache the result
          let cachedTypes: string | null = null

          const typesPath = addTypeTemplate({
            filename: `types/${configKey}.d.ts`,
            async getContents() {
              if (!cachedTypes) {
                // Use the original URL for type generation (not the proxy URL)
                cachedTypes = await generateTypes({
                  url: useUrl(directusUrl),
                  token: options.adminToken!,
                })
              }
              return cachedTypes
            },
          }, { nitro: true, nuxt: true }).dst

          nuxtApp.hook('prepare:types', (options) => {
            options.references.push({ path: typesPath })
          })
        }
        catch (error) {
          logger.error((error as Error).message)
        }
      }
    }
  },
})

interface NuxtDirectusModuleOptions extends ModuleOptions {
  directusUrl: string
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
