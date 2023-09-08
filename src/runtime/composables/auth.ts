import type { loginOptions } from '@directus/sdk'
import { createUser, passwordRequest, passwordReset, readMe, updateMe } from '@directus/sdk'

import { useDirectus } from './directus'
import { useDirectusTokens } from './tokens'
import type { ComputedRef, Ref } from '#imports'
import { computed, useState } from '#imports'
import { useRouter, useRuntimeConfig } from '#app'

import type { DirectusCollections, Single } from '#build/types/directus'

type DirectusUser = Single<DirectusCollections['directus_users']>

export function useDirectusUser(): Ref<DirectusUser | null> {
  return useState('directus.user', () => null)
}

export interface DirectusAuth {
  user: Ref<DirectusUser | null>
  loggedIn: ComputedRef<boolean>
  refreshTokens(): Promise<void>
  fetchUser(): Promise<DirectusUser | null>
  updateUser(data: Partial<DirectusUser>): Promise<DirectusUser | null>
  login(email: string, password: string): Promise<{
    user: DirectusUser | null
    access_token: string
    refreshToken: string | null
    expires: number
    redirect(defaultPath?: string): void
  }>
  logout(): Promise<void>
  register(data: Partial<DirectusUser>): Promise<DirectusUser>
  requestPasswordReset(email: string, resetUrl?: string | null | undefined): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
}

export function useDirectusAuth(): DirectusAuth {
  const config = useRuntimeConfig()
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

  async function updateUser(data: Partial<DirectusUser>) {
    const currentUser = user.value

    if (!currentUser?.id)
      throw new Error('No user available')

    user.value = (await directus.request(updateMe(data as any, config.public.directus.fetchUserParams))) as any

    return user.value
  }

  async function login(email: string, password: string, options: loginOptions = {}) {
    const response = await directus.login(email, password, options)

    if (!response.access_token)
      throw new Error('Login failed, please check your credentials.')

    await fetchUser()

    return {
      user: user.value,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expires: response.expires,
      expiresAt: response.expires_at,
      // Allow redirecting to a specific page after login
      redirect(defaultPath = '/') {
        const router = useRouter()
        const route = router.currentRoute.value
        router.replace({ path: route.query.redirect ? decodeURIComponent(route.query.redirect as string) : defaultPath })
      },
    }
  }

  // Alias for createUser
  async function register(data: Partial<DirectusUser>) {
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
