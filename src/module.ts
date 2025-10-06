import type { Query } from '@directus/sdk'
import type { ImportPresetWithDeprecation } from '@nuxt/schema'

import { addComponentsDir, addImportsDir, addImportsSources, addPlugin, addRouteMiddleware, addTypeTemplate, createResolver, defineNuxtModule, installModule, useLogger } from '@nuxt/kit'
import { defu } from 'defu'
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
     * @type Query<AllDirectusCollections, AllDirectusCollections['directus_users']>['fields']
     */
    readMeFields?: Query<AllDirectusCollections, AllDirectusCollections['directus_users']>['fields']

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
    /**
     * The prefix to your custom types
     * @type string
     * @default ''
     */
    prefix?: string
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
      realtimeAuthMode: 'handshake',
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

    // Normalize devProxy options
    const devProxyConfig = typeof options.devProxy === 'boolean'
      ? { enabled: options.devProxy }
      : { ...options.devProxy }

    // Default values
    const devProxyEnabled = devProxyConfig.enabled ?? nuxtApp.options.dev
    const devProxyPath = devProxyConfig.path ?? '/directus'

    // Store the original URL for type generation and server-side use
    const directusUrl = options.url

    // Set up development proxy if enabled and in dev mode
    if (devProxyEnabled && nuxtApp.options.dev) {
      // Get the dev server configuration from Nuxt
      const devPort = nuxtApp.options.devServer?.port ?? 3000
      const devHost = nuxtApp.options.devServer?.host ?? 'localhost'
      const proxyUrl = `http://${devHost}:${devPort}${devProxyPath}/`

      logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      logger.info(`🔄 Directus Development Proxy Enabled`)
      logger.info(`   Proxy path: ${devProxyPath}`)
      logger.info(`   Forwarding to: ${directusUrl}`)
      logger.info(`   Local URL: ${proxyUrl}`)
      logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

      nuxtApp.options.nitro = nuxtApp.options.nitro || {}
      nuxtApp.options.nitro.devProxy = nuxtApp.options.nitro.devProxy || {}
      nuxtApp.options.nitro.devProxy[devProxyPath] = {
        target: directusUrl,
        changeOrigin: true,
        cookieDomainRewrite: '',
      }

      // Update the URL to use the proxy for runtime requests
      options.url = proxyUrl
    }
    else if (!nuxtApp.options.dev) {
      logger.info(`🌐 Production mode: Connecting directly to ${directusUrl}`)
    }

    (options as any).directusUrl = directusUrl

    nuxtApp.options.runtimeConfig[configKey] = options as any
    nuxtApp.options.runtimeConfig.public = nuxtApp.options.runtimeConfig.public || {}
    nuxtApp.options.runtimeConfig.public[configKey] = defu(nuxtApp.options.runtimeConfig.public[configKey] as any, options)

    delete (nuxtApp.options.runtimeConfig.public[configKey] as any).adminToken

    const resolver = createResolver(import.meta.url)

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
        logger.info('Generating Directus types')

        try {
          // Generate types once and cache the result
          let cachedTypes: string | null = null

          const typesPath = addTypeTemplate({
            filename: `types/${configKey}.d.ts`,
            async getContents() {
              if (!cachedTypes) {
                logger.info('Fetching types from Directus...')
                // Use the original URL for type generation (not the proxy URL)
                cachedTypes = await generateTypes({
                  url: useUrl(directusUrl),
                  token: options.adminToken!,
                  prefix: options.types?.prefix ?? '',
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

declare module '@nuxt/schema' {
  interface ConfigSchema {
    directus?: ModuleOptions & { directusUrl: string }
    publicRuntimeConfig?: {
      directus?: Omit<ModuleOptions, 'adminToken'> & { directusUrl: string }
    }
  }
}
