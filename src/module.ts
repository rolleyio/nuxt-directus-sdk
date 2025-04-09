import type { Query } from '@directus/sdk'
import type { ImportPresetWithDeprecation } from '@nuxt/schema'

import { addComponentsDir, addImportsDir, addImportsSources, addPlugin, addTypeTemplate, createResolver, defineNuxtModule, installModule, useLogger } from '@nuxt/kit'
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
   * Fetch the user serverside
   *
   * @default true
   */
  fetchUser?: boolean

  /**
   * Directus Auth Options
   * @default {}
   * @type Query<DirectusSchema, DirectusSchema['directus_users']>['fields']
   */
  fetchUserFields?: Query<DirectusSchema, DirectusSchema['directus_users']>['fields']

  /**
   * Add Directus Admin in Nuxt Devtools
   *
   * @default true
   */
  devtools?: boolean

  /**
   * Token Cookie Name
   * @type string
   * @default 'directus_access_token'
   */
  cookieNameAccessToken?: string

  /**
   * Refresh Token Cookie Name
   * @type string
   * @default 'directus_refresh_token'
   */
  cookieNameRefreshToken?: string

  /**
   * The max age for auth cookies in seconds.
   * This should match your directus env key AUTH_TOKEN_TTL
   * @type string
   * @default 900
   */
  cookieMaxAge?: number

  /**
   * The max age for auth cookies in seconds.
   * This should match your directus env key REFRESH_TOKEN_TTL
   * @type string
   * @default 604800
   */
  cookieMaxAgeRefreshToken?: number

  /**
   * The SameSite attribute for auth cookies.
   * @type string
   * @default 'lax'
   */
  cookieSameSite?: 'strict' | 'lax' | 'none' | undefined

  /**
   * The Secure attribute for auth cookies.
   * @type boolean
   * @default false
   */
  cookieSecure?: boolean

  /**
   * The Domain attribute for auth cookies.
   * @type string
   * @default undefined
   */
  cookieDomain?: boolean

  /**
   * The prefix to your custom types
   * @type string
   * @default ''
   */
  typePrefix?: string

  /**
   * A path to redirect a user to when not logged in using auth middleware
   * @type string
   * @default '/login'
   */
  loginPath?: string
}

const configKey = 'directus'
const logger = useLogger('nuxt-directus-sdk')

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey,
    compatibility: {
      nuxt: '^3.0.0',
      bridge: false,
    },
  },
  defaults: {
    url: import.meta.env.DIRECTUS_URL ?? '',
    adminToken: import.meta.env.DIRECTUS_ADMIN_TOKEN ?? '',
    devtools: true,
    fetchUser: true,
    fetchUserFields: [],
    cookieNameAccessToken: 'directus_access_token',
    cookieNameRefreshToken: 'directus_refresh_token',

    // Nuxt Cookies Docs @ https://nuxt.com/docs/api/composables/use-cookie
    cookieMaxAge: 900,
    cookieMaxAgeRefreshToken: 604800,
    cookieSameSite: 'lax',
    cookieSecure: false,
    cookieDomain: undefined,
    typePrefix: '',
    loginPath: '/login',
  },
  async setup(options, nuxtApp) {
    if (!options.url) {
      logger.error('nuxt-directus-sdk requires a url to your Directus instance, set it in the config options or .env file as DIRECTUS_URL')
      return
    }

    nuxtApp.options.runtimeConfig[configKey] = { adminToken: options.adminToken ?? '' }
    nuxtApp.options.runtimeConfig.public = nuxtApp.options.runtimeConfig.public || {}
    nuxtApp.options.runtimeConfig.public[configKey] = defu(nuxtApp.options.runtimeConfig.public[configKey] as any, {
      ...options,
      // Don't add the admin token to the public config
      adminToken: null,
    })

    const resolver = createResolver(import.meta.url)

    await installModule('@nuxt/image', {
      directus: {
        baseURL: useUrl(options.url, 'assets'),
      },
    })

    // Add plugin to load user before bootstrap
    addPlugin(resolver.resolve('./runtime/plugin'))

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

    if (options.adminToken) {
      logger.info('Generating Directus types')

      try {
        const typesPath = addTypeTemplate({
          filename: `types/${configKey}.d.ts`,
          getContents() {
            return generateTypes({
              url: useUrl(options.url),
              token: options.adminToken!,
              prefix: options.typePrefix ?? '',
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
    else {
      logger.info('Add DIRECTUS_ADMIN_TOKEN to the .env file to generate directus types')
    }
  },
})

declare module '@nuxt/schema' {
  interface ConfigSchema {
    directus?: ModuleOptions
    publicRuntimeConfig?: {
      directus?: ModuleOptions
    }
  }
}
