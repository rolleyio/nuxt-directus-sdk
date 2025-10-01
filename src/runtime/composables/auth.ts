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
  login: (email: string, password: string, options?: LoginOptions & { redirect?: boolean | RouteLocationRaw }) => Promise<{
    user: DirectusUsers | null
    accessToken: string | null
    refreshToken: string | null
    expires: number | null
    expiresAt: number | null
  }>
  loginWithProvider: (provider: string, redirectOnLogin?: string) => Promise<void>
  logout: (redirect?: boolean | RouteLocationRaw) => Promise<void>
  createUser: (data: Partial<DirectusUsers>) => Promise<DirectusUsers>
  register: (data: Partial<DirectusUsers>) => Promise<DirectusUsers>
  inviteUser: (email: string, role: string, inviteUrl?: string | undefined) => Promise<void>
  acceptUserInvite: (token: string, password: string) => Promise<void>
  passwordRequest: (email: string, resetUrl?: string | null | undefined) => Promise<void>
  passwordReset: (token: string, password: string) => Promise<void>
}

export function useDirectusUser(): Ref<DirectusUsers | null> {
  return useState('directus.user', () => null)
}

export function useDirectusAuth(): DirectusAuth {
  const config = useRuntimeConfig()
  const router = useRouter()
  const directus = useDirectus()
  const user = useDirectusUser()
  const nuxtApp = useNuxtApp()

  const loggedIn = computed(() => user.value !== null)

  async function readMe() {
    try {
      user.value = await directus.request(directusReadMe({ fields: config.public.directus.auth?.readMeFields ?? ['*'] }))
    }
    catch {
      user.value = null
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

    return {
      user: user.value,
      accessToken: null,
      refreshToken: null,
      expires: null,
      expiresAt: null,
    }
  }

  async function loginWithProvider(provider: string, redirectOnLogin?: string) {
    await logout()
    const redirect = `${window.location.origin}${redirectOnLogin ?? router.currentRoute.value.fullPath}`
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

  async function passwordRequest(email: string, resetUrl?: string | undefined) {
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
