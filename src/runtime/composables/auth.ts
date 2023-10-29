import type { LoginOptions } from '@directus/sdk'
import { createUser as directusCreateUser, inviteUser as directusInviteUser, acceptUserInvite as directusAcceptUserInvite, passwordRequest as directusPasswordRequest, passwordReset as directusPasswordReset, readMe as directusReadMe, updateMe as directusUpdateMe } from '@directus/sdk'
import type { RouteLocationRaw } from '#vue-router'

import type { DirectusUsers } from 'nuxt/app'
import { useDirectus } from './directus'
import { useDirectusTokens } from './tokens'
import type { ComputedRef, Ref } from '#imports'
import { computed, useState, } from '#imports'
import { navigateTo, useNuxtApp, useRouter, useRuntimeConfig } from '#app'

// Auto types don't seem to be generating correctly here, so we need to specify the return type
// Would be better if this wasn't needed
export interface DirectusAuth {
  user: Ref<DirectusUsers | null>
  loggedIn: ComputedRef<boolean>
  readMe(): Promise<DirectusUsers | null>
  updateMe(data: Partial<DirectusUsers>): Promise<DirectusUsers | null>
  login(email: string, password: string, options: LoginOptions & { redirect?: boolean | RouteLocationRaw }): Promise<{
    user: DirectusUsers | null
    accessToken: string
    refreshToken: string | null
    expires: number | null
    expiresAt: number | null
  }>
  loginWithProvider(provider: string, redirectOnLogin?: string): Promise<void>
  logout(): Promise<void>
  createUser(data: Partial<DirectusUsers>): Promise<DirectusUsers>
  register(data: Partial<DirectusUsers>): Promise<DirectusUsers>
  inviteUser(email: string, role: string, inviteUrl?: string | undefined): Promise<void>
  acceptUserInvite(token: string, password: string): Promise<void>
  passwordRequest(email: string, resetUrl?: string | null | undefined): Promise<void>
  passwordReset(token: string, password: string): Promise<void>
}

export function useDirectusUser(): Ref<DirectusUsers | null> {
  return useState('directus.user', () => null)
}

export function useDirectusAuth(): DirectusAuth {
  const config = useRuntimeConfig()
  const router = useRouter()
  const directus = useDirectus()
  const tokens = useDirectusTokens()
  const user = useDirectusUser()

  const loggedIn = computed(() => user.value !== null)

  async function readMe() {
    try {
      // TEST is this logic right? trying to minimize refresh tokens
      if (!tokens.accessToken.value && !tokens.refreshToken.value)
        throw new Error('No refresh token')

      if (!tokens.accessToken.value)
        await directus.refresh()

      user.value = await directus.request(directusReadMe(config.public.directus.fetchUserParams))
    }
    catch (e) {
      user.value = null
    }

    // TEST - can you use this hook?
    await useNuxtApp().callHook('directus:loggedIn', user.value)

    return user.value
  }

  async function updateMe(data: Partial<DirectusUsers>) {
    const currentUser = user.value

    if (!currentUser?.id)
      throw new Error('No user available')

    user.value = await directus.request(directusUpdateMe(data, config.public.directus.fetchUserParams))

    return user.value
  }

  async function login(email: string, password: string, options: LoginOptions & { redirect?: boolean | RouteLocationRaw } = {}) {
    const response = await directus.login(email, password, options)

    if (!response.access_token)
      throw new Error('Login failed, please check your credentials.')

    await readMe()

    // TEST
    if (options.redirect) {
      const route = router.currentRoute.value
      
      if (typeof options.redirect !== 'boolean')
        navigateTo(options.redirect)
      else if (route?.query?.redirect)
        navigateTo({ path: decodeURIComponent(route.query.redirect as string) })
    }

    return {
      user: user.value,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expires: response.expires,
      expiresAt: response.expires_at,
    }
  }

  // TEST this
  async function loginWithProvider(provider: string, redirectOnLogin?: string) {
    await logout()
    const redirect = `${window.location.origin}${redirectOnLogin ?? router.currentRoute.value.fullPath}`
    await navigateTo(`${useDirectusUrl()}/auth/login/${provider}?redirect=${encodeURIComponent(redirect)}`, { external: true })
  }

  async function createUser(data: Partial<DirectusUsers>) {
    return directus.request(directusCreateUser(data))
  }
  
  // Alias for createUser
  async function register(data: Partial<DirectusUsers>) {
    return createUser(data)
  }

  async function inviteUser(email: string, role: string, inviteUrl?: string | undefined): Promise<void> {
    return directus.request(directusInviteUser(email, role, inviteUrl))
  }

  async function acceptUserInvite(token: string, password: string): Promise<void> {
    return directus.request(directusAcceptUserInvite(token, password))
  }

  async function passwordRequest(email: string, resetUrl?: string | undefined): Promise<void> {
    return directus.request(directusPasswordRequest(email, resetUrl))
  }

  async function passwordReset(token: string, password: string): Promise<void> {
    return directus.request(directusPasswordReset(token, password))
  }

  async function logout(): Promise<void> {
    try {
      await directus.logout()
    }
    finally {
      user.value = null
      tokens.refreshToken.value = null
      tokens.accessToken.value = null
      tokens.expires.value = null
      tokens.expiresAt.value = null
    }

    // TEST - can you use this hook?
    await useNuxtApp().callHook('directus:loggedIn', user.value)
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
