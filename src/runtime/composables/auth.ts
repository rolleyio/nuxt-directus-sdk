import type { LoginOptions } from '@directus/sdk'
import { createUser, passwordRequest, passwordReset, readMe, updateMe } from '@directus/sdk'
import type { RouteLocationRaw } from '#vue-router'

import type { DirectusUsers } from 'nuxt/app'
import { useDirectus } from './directus'
import { useDirectusTokens } from './tokens'
import type { ComputedRef, Ref } from '#imports'
import { computed, useState, } from '#imports'
import { navigateTo, useRouter, useRuntimeConfig } from '#app'

export function useDirectusUser(): Ref<DirectusUsers | null> {
  return useState('directus.user', () => null)
}

export interface DirectusAuth {
  user: Ref<DirectusUsers | null>
  loggedIn: ComputedRef<boolean>
  refreshTokens(): Promise<void>
  fetchUser(): Promise<DirectusUsers | null>
  updateUser(data: Partial<DirectusUsers>): Promise<DirectusUsers | null>
  login(email: string, password: string, options: LoginOptions & { redirect?: boolean | RouteLocationRaw }): Promise<{
    user: DirectusUsers | null
    accessToken: string
    refreshToken: string | null
    expires: number
    expiresAt: number | null
  }>
  logout(): Promise<void>
  register(data: Partial<DirectusUsers>): Promise<DirectusUsers>
  requestPasswordReset(email: string, resetUrl?: string | null | undefined): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
}

export function useDirectusAuth(): DirectusAuth {
  const config = useRuntimeConfig()
  const router = useRouter()
  const directus = useDirectus()
  const tokens = useDirectusTokens()
  const user = useDirectusUser()

  const loggedIn = computed(() => user.value !== null)

  async function fetchUser() {
    try {
      if (!tokens.refreshToken.value)
        throw new Error('No refresh token')

      await directus.refresh()
      user.value = await directus.request(readMe(config.public.directus.fetchUserParams)) as any
    }
    catch (e) {
      user.value = null
    }

    return user.value
  }

  async function updateUser(data: Partial<DirectusUsers>) {
    const currentUser = user.value

    if (!currentUser?.id)
      throw new Error('No user available')

    user.value = (await directus.request(updateMe(data as any, config.public.directus.fetchUserParams))) as any

    return user.value
  }

  async function login(email: string, password: string, options: LoginOptions & { redirect?: boolean | RouteLocationRaw } = {}) {
    const response = await directus.login(email, password, options)

    if (!response.access_token)
      throw new Error('Login failed, please check your credentials.')

    await fetchUser()

    
    if (options.redirect) {
      const route = router.currentRoute.value
      
      if (options.redirect === true && route?.query?.redirect)
        navigateTo({ path: decodeURIComponent(route.query.redirect as string) })
      else 
        navigateTo(options.redirect as any)
    }

    return {
      user: user.value,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expires: response.expires,
      expiresAt: response.expires_at,
    }
  }

  // Alias for createUser
  async function register(data: Partial<DirectusUsers>) {
    return directus.request(createUser(data as any))
  }

  async function requestPasswordReset(email: string, resetUrl?: string | undefined) {
    directus.request(passwordRequest(email, resetUrl))
  }

  async function resetPassword(token: string, password: string) {
    directus.request(passwordReset(token, password))
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
  }

  return {
    user,
    loggedIn,
    fetchUser,
    updateUser,
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
  }
}
