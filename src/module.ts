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
     * ReadMe fields to fetch
     * @default []
     * @type Query<AllDirectusCollections, AllDirectusCollections['directus_users']>['fields']
     */
    readMeFields?: Query<AllDirectusCollections, AllDirectusCollections['directus_users']>['fields']

    cookies?: {
      /**
       * Session token cookie name
       * @default 'directus_access_token'
       */
      accessToken?: string
      /**
       * Refresh token cookie name
       * @default 'directus_refresh_token'
       */
      refreshToken?: string
      /**
       * Logged in token cookie name
       * @default 'directus_logged_in'
       */
      loggedInToken?: string
      /**
       * Session token cookie max age
       * @default 900
       */
      maxAge?: number
      /**
       * Refresh token cookie max age
       * @default 604800
       */
      maxAgeRefreshToken?: number

      /**
       * SameSite cookie attribute
       * @default 'lax'
       */
      sameSite?: 'lax' | 'strict' | 'none'
      /**
       * Secure cookie attribute
       * @default false
       * @type boolean
       */
      secure?: boolean
      /**
       * Domain cookie attribute
       * @default undefined
       * @type string | undefined
       */
      domain?: string | undefined
    }

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
      readMeFields: [],
      cookies: {
        accessToken: 'directus_access_token',
        refreshToken: 'directus_refresh_token',
        loggedInToken: 'directus_logged_in',

        maxAge: 900,
        maxAgeRefreshToken: 604800,
        // Nuxt Cookies Docs @ https://nuxt.com/docs/api/composables/use-cookie
        sameSite: 'lax',
        secure: false,
        domain: undefined,
      },
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
          'useDirectus',
          'useUserDirectus',
          'useAdminDirectus',
          'useDirectusUrl',
          'useDirectusAccessToken',
        ],
      })
    })

    if (options.devtools) {
      const adminUrl = useUrl(options.url, 'admin')
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
          const typesPath = addTypeTemplate({
            filename: `types/${configKey}.d.ts`,
            getContents() {
              return generateTypes({
                url: useUrl(options.url),
                token: options.adminToken!,
                prefix: options.types?.prefix ?? '',
              })
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
    directus?: ModuleOptions
    publicRuntimeConfig?: {
      directus?: Omit<ModuleOptions, 'adminToken'>
    }
  }
}
