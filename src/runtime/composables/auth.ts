import type { ComputedRef, Ref } from '#imports'
import type { RouteLocationRaw } from '#vue-router'
import type { LoginOptions } from '@directus/sdk'
import type {
  DirectusError,
  RegisterUserInput,
} from '@directus/types'
import { navigateTo, useRouter, useRuntimeConfig } from '#app'
import { computed, useRequestURL, useState } from '#imports'
import {
  acceptUserInvite as directusAcceptUserInvite,
  createUser as directusCreateUser,
  inviteUser as directusInviteUser,
  passwordRequest as directusPasswordRequest,
  passwordReset as directusPasswordReset,
  readMe as directusReadMe,
  updateMe as directusUpdateMe,
} from '@directus/sdk'
import { joinURL, withoutTrailingSlash } from 'ufo'
import { useDirectus, useDirectusOriginUrl } from './directus'

// Auto types don't seem to be generating correctly here, so we need to specify the return type
export interface DirectusAuth {
  user: Ref<DirectusUser | null>
  loggedIn: ComputedRef<boolean>
  readMe: () => Promise<DirectusUser | DirectusError | null>
  updateMe: (data: Partial<DirectusUser>) => Promise<DirectusUser | DirectusError | null>
  login: (email: string, password: string, options?: LoginOptions & { redirect?: boolean | RouteLocationRaw }) => Promise<DirectusUser | null>
  loginWithProvider: (provider: string, redirectOnLogin?: boolean | string) => Promise<void>
  logout: (redirect?: boolean | RouteLocationRaw) => Promise<void>
  createUser: (data: RegisterUserInput & Partial<Omit<DirectusUser, 'id' | 'email' | 'password'>>) => Promise<DirectusUser>
  register: (data: RegisterUserInput & Partial<Omit<DirectusUser, 'id' | 'email' | 'password'>>) => Promise<DirectusUser>
  inviteUser: (email: string, role: string, inviteUrl?: string | undefined) => Promise<void>
  acceptUserInvite: (token: string, password: string) => Promise<void>
  passwordRequest: (email: string, resetUrl?: string | undefined) => Promise<void>
  passwordReset: (token: string, password: string) => Promise<void>
}

export function useDirectusUser(): Ref<DirectusUser | null> {
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

  const loggedIn = computed(() => user.value !== null)

  async function readMe() {
    // Prevent duplicate concurrent calls
    if (loading.value) {
      return user.value
    }

    loading.value = true

    try {
      const response = await directus.request(directusReadMe({ fields: (config.public.directus.auth?.readMeFields ?? ['*']) as any }))
      if (!response.id) {
        console.warn('Directus is not configured to return the \'id\' field for DirectusUsers.')
      }
      user.value = response as unknown as DirectusUser
    }
    catch (error) {
      console.error('[Auth] Failed to fetch user:', error)
      user.value = null
    }
    finally {
      loading.value = false
    }

    return user.value
  }
  // FIXME: Avatar requires a separated upload and/or ability to apply Object or string -> Possible Solution is to chunk into uploadDirectusFile -> Attach 'id' string to data.avatar UpdateMe call.
  // FIXME: Role and Policies will work, but due to the Omit won't get type safety (Previous implementation also didn't have typesafety for them but now it's explicit.)
  async function updateMe(data: Partial<Omit<DirectusUser, 'avatar' | 'role' | 'policies'>>) {
    const currentUser = user.value

    if (!currentUser?.id)
      throw new Error('No user available')
    // INVESTIGATE: Does this cause issues with creative inputs in the config? Config won't have typesafety so probably a heavy lift for a low return.
    const response = await directus.request(directusUpdateMe(data as any, { fields: (config.public.directus.auth?.readMeFields ?? ['*']) as any }))
    user.value = response as unknown as DirectusUser
    return user.value
  }

  async function login(email: string, password: string, options?: Omit<LoginOptions, 'mode'> & { redirect?: boolean | RouteLocationRaw }) {
    await directus.login({ email, password }, { ...options, mode: 'session' })

    await readMe()

    const redirect = options?.redirect ?? true

    if (redirect !== false) {
      const route = router.currentRoute.value

      if (typeof redirect !== 'boolean') {
        await navigateTo(redirect)
      }
      else if (route?.query?.redirect) {
        await navigateTo({ path: decodeURIComponent(route.query.redirect as string) })
      }
      else {
        await navigateTo(config.public.directus.auth?.redirect?.home ?? '/')
      }
    }

    return user.value
  }

  async function loginWithProvider(provider: string, redirectOnLogin: boolean | string = true) {
    const { origin, href } = useRequestURL()

    let redirectPath: string

    if (typeof redirectOnLogin === 'boolean') {
      redirectPath = redirectOnLogin ? config.public.directus.auth.redirect.login : href
    }
    else if (redirectOnLogin) {
      redirectPath = redirectOnLogin
    }
    else {
      redirectPath = href
    }
    const redirect = joinURL(origin, redirectPath)
    const sanitizedRedirect = withoutTrailingSlash(redirect)

    // Use the real Directus URL — SSO requires direct browser navigation to Directus, not through the dev proxy
    await navigateTo(useDirectusOriginUrl(`/auth/login/${provider}?redirect=${encodeURIComponent(sanitizedRedirect)}`), { external: true })
  }

  async function createUser(data: RegisterUserInput) {
    const response = await directus.request(directusCreateUser(data))
    return response as unknown as DirectusUser
  }

  // Alias for createUser
  async function register(data: RegisterUserInput) {
    return createUser(data as RegisterUserInput)
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
      const defaultRedirect = config.public.directus.auth?.redirect?.logout ?? config.public.directus.auth?.redirect?.login ?? '/'
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
