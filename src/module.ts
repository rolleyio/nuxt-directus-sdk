import { defu } from 'defu'
import { addComponentsDir, addImportsDir, addImportsSources, addPlugin, addTypeTemplate, createResolver, defineNuxtModule, tryResolveModule, useLogger } from '@nuxt/kit'
import { joinURL } from 'ufo'
import type { Query } from '@directus/sdk'

import { name, version } from '../package.json'
import { generateTypes } from './runtime/types'
import type { AllDirectusCollections } from '#build/types/directus'

export interface ModuleOptions {
  /**
   * Directus API URL
   * @default process.env.DIRECTUS_URL
   * @type string
   */
  url?: string

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
   * @type Query<AllDirectusCollections, AllDirectusCollections['directus_users']>
   */
  fetchUserParams?: Query<AllDirectusCollections, AllDirectusCollections['directus_users']>

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
   * The Secure attribute for auth cookies.
   * @type string
   * @default ''
   */
  typePrefix?: string
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
    url: process.env.DIRECTUS_URL ?? '',
    adminToken: process.env.DIRECTUS_ADMIN_TOKEN ?? '',
    devtools: true,
    fetchUser: true,
    fetchUserParams: {},
    cookieNameAccessToken: 'directus_access_token',
    cookieNameRefreshToken: 'directus_refresh_token',

    // Nuxt Cookies Docs @ https://nuxt.com/docs/api/composables/use-cookie
    cookieMaxAge: 900,
    cookieMaxAgeRefreshToken: 604800,
    cookieSameSite: 'lax',
    cookieSecure: false,
    typePrefix: '',
  },
  async setup(options, nuxt) {
    if (!tryResolveModule('@directus/sdk')) {
      logger.error('nuxt-directus-sdk requries @directus/sdk^11.0.3, install it with `npm i @directus/sdk`, `yarn add @directus/sdk`, `pnpm add @directus/sdk` or `bun install @directus/sdk`')
      return
    }

    nuxt.options.runtimeConfig[configKey] = { adminToken: options.adminToken ?? '' }
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    nuxt.options.runtimeConfig.public[configKey] = defu(nuxt.options.runtimeConfig.public[configKey] as any, {
      ...options,
      // Don't add the admin token to the public key
      adminToken: null,
    })

    const resolver = createResolver(import.meta.url)

    // Add plugin to load user before bootstrap
    addPlugin(resolver.resolve('./runtime/plugin'))
    addPlugin({
      src: resolver.resolve('./runtime/plugin.client'),
      mode: 'client',
    })

    // Add composables
    addImportsDir(resolver.resolve('./runtime/composables'))
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      pathPrefix: false,
      prefix: '',
      global: true,
    })

    // Adds notifications but not sure it's the scope of this project - leave it in for now?
    nuxt.options.css.push('vue-toastification/dist/index.css')
    nuxt.options.build.transpile.push('vue-toastification')

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}

      // Inline module runtime in Nitro bundle
      nitroConfig.externals = defu(typeof nitroConfig.externals === 'object' ? nitroConfig.externals : {}, {
        inline: [resolver.resolve('./runtime')],
      })
      nitroConfig.alias[`#${configKey}`] = resolver.resolve('./runtime/server/services')
    })

    try {
      const typesPath = addTypeTemplate({
        filename: `types/${configKey}-server.d.ts`,
        getContents: () => [
        `declare module '#${configKey}-server' {`,
        `  const useDirectus: typeof import('${resolver.resolve('./runtime/server/services')}').useDirectus`,
        `  const useAdminDirectus: typeof import('${resolver.resolve('./runtime/server/services')}').useAdminDirectus`,
        `  const useDirectusUrl: typeof import('${resolver.resolve('./runtime/server/services')}').useDirectusUrl`,
        `  const useDirectusAccessToken: typeof import('${resolver.resolve('./runtime/server/services')}').useDirectusAccessToken`,
        '}',
        ].join('\n'),
      }).dst

      nuxt.hook('prepare:types', (options) => {
        options.references.push({ path: typesPath })
      })
    }
    catch (error) {
      logger.error((error as Error).message)
    }

    if (options.url) {
      const adminUrl = joinURL(options.url, '/admin/')
      logger.info(`Directus Admin URL: ${adminUrl}`)

      if (options.devtools) {
        // @ts-expect-error - private API
        nuxt.hook('devtools:customTabs', (iframeTabs) => {
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

      if (options.adminToken) {
        logger.info('Generating Directus types')

        try {
          const typesPath = addTypeTemplate({
            filename: `types/${configKey}.d.ts`,
            getContents() {
              return generateTypes({
                url: options.url!,
                token: options.adminToken!,
                prefix: options.typePrefix ?? '',
              })
            },
          }).dst

          nuxt.hook('prepare:types', (options) => {
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
    }

    // Import useful directus functions
    // Just found, we should look to merge?
    // https://github.com/becem-gharbi/nuxt-directus
    addImportsSources({
      from: '@directus/sdk',
      imports: [
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
    })
  },
})
