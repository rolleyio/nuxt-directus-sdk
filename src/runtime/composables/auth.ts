import type { ComputedRef, Ref } from '#imports'
import type { RouteLocationRaw } from '#vue-router'

import type { LoginOptions } from '@directus/sdk'
import { navigateTo, useNuxtApp, useRouter, useRuntimeConfig } from '#app'
import { computed, useState } from '#imports'
import { acceptUserInvite as directusAcceptUserInvite, createUser as directusCreateUser, inviteUser as directusInviteUser, passwordRequest as directusPasswordRequest, passwordReset as directusPasswordReset, readMe as directusReadMe, updateMe as directusUpdateMe } from '@directus/sdk'
import { useDirectus, useDirectusUrl } from './directus'

// Auto types don't seem to be generating correctly here, so we need to specify the return type
export interface DirectusAuth {
  user: Ref<DirectusUsers | null>
  loggedIn: ComputedRef<boolean>
  readMe: () => Promise<DirectusUsers | null>
  updateMe: (data: Partial<DirectusUsers>) => Promise<DirectusUsers | null>
  login: (email: string, password: string, options?: LoginOptions & { redirect?: boolean | RouteLocationRaw }) => Promise<DirectusUsers | null>
  loginWithProvider: (provider: string, redirectOnLogin?: string) => Promise<void>
  logout: (redirect?: boolean | RouteLocationRaw) => Promise<void>
  createUser: (data: Partial<DirectusUsers>) => Promise<DirectusUsers>
  register: (data: Partial<DirectusUsers>) => Promise<DirectusUsers>
  inviteUser: (email: string, role: string, inviteUrl?: string | undefined) => Promise<void>
  acceptUserInvite: (token: string, password: string) => Promise<void>
  passwordRequest: (email: string, resetUrl?: string | undefined) => Promise<void>
  passwordReset: (token: string, password: string) => Promise<void>
}

export function useDirectusUser(): Ref<DirectusUsers | null> {
  return useState('directus.user', () => null)
}

function useDirectusUserLoading(): Ref<boolean> {
  return useState('directus.user.loading', () => false)
}

export function useDirectusAuth(): DirectusAuth {
  const config = useRuntimeConfig()
  const router = useRouter()
  const directus = useDirectus()
  const user = useDirectusUser()
  const loading = useDirectusUserLoading()
  const nuxtApp = useNuxtApp()

  const loggedIn = computed(() => user.value !== null)

  async function readMe() {
    // Prevent duplicate concurrent calls
    if (loading.value) {
      // eslint-disable-next-line no-console
      console.log('[Auth] Already fetching user, skipping...')
      return user.value
    }

    loading.value = true

    try {
      // eslint-disable-next-line no-console
      console.log('[Auth] Fetching user from Directus...')
      const result = await directus.request(directusReadMe({ fields: (config.public.directus.auth?.readMeFields ?? ['*']) as any }))
      console.log('Got the result?', result)

      user.value = { id: 'test' }
      // eslint-disable-next-line no-console
      console.log('[Auth] User fetched successfully:', user.value?.id)
    }
    catch (error) {
      console.error('[Auth] Failed to fetch user:', error)
      user.value = null
    }
    finally {
      loading.value = false
    }

    await nuxtApp.callHook('directus:loggedIn', user.value)

    return user.value
  }

  async function updateMe(data: Partial<DirectusUsers>) {
    const currentUser = user.value

    if (!currentUser?.id)
      throw new Error('No user available')

    user.value = await directus.request(directusUpdateMe(data, { fields: config.public.directus.auth?.readMeFields ?? ['*'] }))

    return user.value
  }

  async function login(email: string, password: string, options?: Omit<LoginOptions, 'mode'> & { redirect?: boolean | RouteLocationRaw }) {
    await directus.login({ email, password }, { ...options, mode: 'session' })

    await readMe()

    const redirect = options?.redirect ?? true

    if (redirect !== false) {
      const route = router.currentRoute.value

      if (typeof redirect !== 'boolean') {
        navigateTo(redirect)
      }
      else if (route?.query?.redirect) {
        navigateTo({ path: decodeURIComponent(route.query.redirect as string) })
      }
      else {
        navigateTo(config.public.directus.auth?.redirect?.home ?? '/')
      }
    }

    return user.value
  }

  async function loginWithProvider(provider: string, redirectOnLogin?: string) {
    // Build redirect URL for after SSO authentication
    const redirect = `${window.location.origin}${redirectOnLogin ?? router.currentRoute.value.fullPath}`
    // Redirect to Directus SSO endpoint - session cookie will be set by Directus
    await navigateTo(useDirectusUrl(`/auth/login/${provider}?redirect=${encodeURIComponent(redirect)}`), { external: true })
  }

  async function createUser(data: Partial<DirectusUsers>) {
    return directus.request(directusCreateUser(data))
  }

  // Alias for createUser
  async function register(data: Partial<DirectusUsers>) {
    return createUser(data)
  }

  async function inviteUser(email: string, role: string, inviteUrl?: string | undefined) {
    return directus.request(directusInviteUser(email, role, inviteUrl))
  }

  async function acceptUserInvite(token: string, password: string) {
    return directus.request(directusAcceptUserInvite(token, password))
  }

  async function passwordRequest(email: string, resetUrl?: string) {
    return directus.request(directusPasswordRequest(email, resetUrl))
  }

  async function passwordReset(token: string, password: string) {
    return directus.request(directusPasswordReset(token, password))
  }

  async function logout(redirect: boolean | RouteLocationRaw = true) {
    try {
      await directus.logout()
    }
    finally {
      user.value = null
    }

    if (redirect) {
      const defaultRedirect = config.public.directus.auth?.redirect?.logout ?? config.public.directus.auth?.redirect?.home ?? '/'
      const redirectTo = typeof redirect === 'boolean' ? defaultRedirect : redirect

      await navigateTo(redirectTo)
    }
  }

  return {
    user,
    loggedIn,
    readMe,
    updateMe,
    createUser,
    register,
    login,
    loginWithProvider,
    logout,
    inviteUser,
    acceptUserInvite,
    passwordRequest,
    passwordReset,
  }
}
