import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockUser, mockUpdatedUser } from './fixtures/directus-sdk/auth.data'
import {
  acceptUserInviteSdkMock,
  createUserSdkMock,
  inviteUserSdkMock,
  loginMock,
  logoutMock,
  mockDirectusAuth,
  passwordRequestSdkMock,
  passwordResetSdkMock,
  readMeSdkMock,
  requestMock,
  updateMeSdkMock,
} from './fixtures/directus-sdk/auth.mock'
import {
  mockRuntimeConfig,
  navigateToMock,
  resetMockRuntimeConfig,
  routerState,
  stateStore,
  useRequestURLMock,
  useRouterMock,
} from './fixtures/nuxt/composables.mock'

import { useDirectusAuth, useDirectusUser } from '../src/runtime/composables/auth'

vi.mock('#app', async () => {
  const { navigateToMock, useRouterMock, mockRuntimeConfig } = await import('./fixtures/nuxt/composables.mock')
  return {
    navigateTo: navigateToMock,
    useRouter: useRouterMock,
    useRuntimeConfig: vi.fn(() => mockRuntimeConfig),
  }
})

vi.mock('#imports', async () => {
  const { useStateMock, useRequestURLMock } = await import('./fixtures/nuxt/composables.mock')
  const { computed } = await import('vue')
  return {
    computed,
    useState: useStateMock,
    useRequestURL: useRequestURLMock,
  }
})

vi.mock('../src/runtime/composables/directus', async () => {
  const { requestMock, loginMock, logoutMock } = await import('./fixtures/directus-sdk/auth.mock')
  return {
    useDirectus: vi.fn(() => ({ request: requestMock, login: loginMock, logout: logoutMock })),
    useDirectusOriginUrl: vi.fn((path = '') => `https://directus.example.com${path}`),
  }
})

vi.mock('@directus/sdk', async () => {
  const {
    readMeSdkMock,
    updateMeSdkMock,
    createUserSdkMock,
    inviteUserSdkMock,
    acceptUserInviteSdkMock,
    passwordRequestSdkMock,
    passwordResetSdkMock,
  } = await import('./fixtures/directus-sdk/auth.mock')
  return {
    readMe: readMeSdkMock,
    updateMe: updateMeSdkMock,
    createUser: createUserSdkMock,
    inviteUser: inviteUserSdkMock,
    acceptUserInvite: acceptUserInviteSdkMock,
    passwordRequest: passwordRequestSdkMock,
    passwordReset: passwordResetSdkMock,
  }
})

beforeEach(() => {
  stateStore.clear()
  routerState.query = {}
  resetMockRuntimeConfig()
  useRequestURLMock.mockReturnValue({ origin: 'http://localhost:3000', href: 'http://localhost:3000/' })
  useRouterMock.mockReturnValue({ currentRoute: { value: { query: routerState.query } } })
  requestMock.mockReset()
  loginMock.mockReset()
  logoutMock.mockReset()
  navigateToMock.mockReset()
  readMeSdkMock.mockReset()
  updateMeSdkMock.mockReset()
  createUserSdkMock.mockReset()
  inviteUserSdkMock.mockReset()
  acceptUserInviteSdkMock.mockReset()
  passwordRequestSdkMock.mockReset()
  passwordResetSdkMock.mockReset()
  // Restore default spy implementations
  readMeSdkMock.mockImplementation((...args: unknown[]) => args)
  updateMeSdkMock.mockImplementation((...args: unknown[]) => args)
  createUserSdkMock.mockImplementation((...args: unknown[]) => args)
  inviteUserSdkMock.mockImplementation((...args: unknown[]) => args)
  acceptUserInviteSdkMock.mockImplementation((...args: unknown[]) => args)
  passwordRequestSdkMock.mockImplementation((...args: unknown[]) => args)
  passwordResetSdkMock.mockImplementation((...args: unknown[]) => args)
})

describe('useDirectusUser', () => {
  it('returns a Ref<DirectusUser | null> backed by useState key "directus.user"', () => {
    const user = useDirectusUser()
    expect(user.value).toBeNull()
    // Verify it's the same ref as the stateStore key
    expect(stateStore.get('directus.user')).toBe(user)
  })
})

describe('useDirectusAuth', () => {
  describe('readMe', () => {
    it('fetches the current user and sets user.value on success', async () => {
      mockDirectusAuth().withVersion('latest')
      const { readMe, user } = useDirectusAuth()

      const result = await readMe()

      expect(result).toStrictEqual(mockUser)
      expect(user.value).toStrictEqual(mockUser)
    })

    it('returns null and sets user.value = null when the SDK throws', async () => {
      requestMock.mockRejectedValue(new Error('Unauthorized'))
      const { readMe, user } = useDirectusAuth()

      const result = await readMe()

      expect(result).toBeNull()
      expect(user.value).toBeNull()
    })

    it('prevents concurrent calls - second call while loading returns current user.value', async () => {
      let resolveRequest: (v: unknown) => void = () => {}
      requestMock.mockImplementationOnce(() =>
        new Promise((resolve) => { resolveRequest = resolve }))

      const { readMe } = useDirectusAuth()

      const p1 = readMe()
      const p2 = readMe() // called while p1 is in progress

      await expect(p2).resolves.toBeNull()
      expect(requestMock).toHaveBeenCalledOnce()

      resolveRequest(mockUser)
      await p1
    })

    it('logs a warning when the response does not include an id field', async () => {
      requestMock.mockResolvedValue({ email: 'test@example.com' })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await useDirectusAuth().readMe()

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('id'))
      warnSpy.mockRestore()
    })

    it('passes configured readMeFields as fields query when non-empty', async () => {
      mockDirectusAuth().withVersion('latest')
      mockRuntimeConfig.public.directus.auth.readMeFields = ['id', 'email']

      await useDirectusAuth().readMe()

      expect(readMeSdkMock).toHaveBeenCalledWith({ fields: ['id', 'email'] })
    })

    it('passes no fields query when readMeFields is empty', async () => {
      mockDirectusAuth().withVersion('latest')
      // readMeFields is [] by default from resetMockRuntimeConfig

      await useDirectusAuth().readMe()

      expect(readMeSdkMock).toHaveBeenCalledWith(undefined)
    })
  })

  describe('updateMe', () => {
    it('throws "No user available" when user.value is null', async () => {
      await expect(useDirectusAuth().updateMe({ first_name: 'New' })).rejects.toThrow('No user available')
    })

    it('throws "No user available" when user.value has no id', async () => {
      useDirectusUser().value = {} as DirectusUser

      await expect(useDirectusAuth().updateMe({ first_name: 'New' })).rejects.toThrow('No user available')
    })

    it('updates user.value with the SDK response and returns it', async () => {
      requestMock.mockResolvedValue(mockUpdatedUser)
      useDirectusUser().value = mockUser as unknown as DirectusUser

      const result = await useDirectusAuth().updateMe({ first_name: 'Updated' })

      expect(result).toStrictEqual(mockUpdatedUser)
      expect(useDirectusUser().value).toStrictEqual(mockUpdatedUser)
    })

    it('passes configured readMeFields as fields query when non-empty', async () => {
      requestMock.mockResolvedValue(mockUser)
      mockRuntimeConfig.public.directus.auth.readMeFields = ['id', 'first_name']
      useDirectusUser().value = mockUser as unknown as DirectusUser

      await useDirectusAuth().updateMe({ first_name: 'Updated' })

      expect(updateMeSdkMock).toHaveBeenCalledWith(
        expect.anything(),
        { fields: ['id', 'first_name'] },
      )
    })

    it('passes no fields query when readMeFields is empty', async () => {
      requestMock.mockResolvedValue(mockUser)
      useDirectusUser().value = mockUser as unknown as DirectusUser

      await useDirectusAuth().updateMe({ first_name: 'Updated' })

      expect(updateMeSdkMock).toHaveBeenCalledWith(expect.anything(), undefined)
    })
  })

  describe('login', () => {
    it('calls directus.login with mode: session and then calls readMe', async () => {
      mockDirectusAuth().withVersion('latest')

      await useDirectusAuth().login('user@example.com', 'secret')

      expect(loginMock).toHaveBeenCalledWith(
        { email: 'user@example.com', password: 'secret' },
        { mode: 'session' },
      )
      expect(requestMock).toHaveBeenCalledOnce() // readMe call
    })

    it('redirects to auth.redirect.home by default after login', async () => {
      mockDirectusAuth().withVersion('latest')

      await useDirectusAuth().login('user@example.com', 'secret')

      expect(navigateToMock).toHaveBeenCalledWith('/')
    })

    it('redirects to the query.redirect param when present', async () => {
      mockDirectusAuth().withVersion('latest')
      routerState.query = { redirect: encodeURIComponent('/dashboard') }
      useRouterMock.mockReturnValue({ currentRoute: { value: { query: routerState.query } } })

      await useDirectusAuth().login('user@example.com', 'secret')

      expect(navigateToMock).toHaveBeenCalledWith({ path: '/dashboard' })
    })

    it('redirects to the provided RouteLocationRaw when redirect option is a non-boolean', async () => {
      mockDirectusAuth().withVersion('latest')

      await useDirectusAuth().login('user@example.com', 'secret', { redirect: '/custom-page' })

      expect(navigateToMock).toHaveBeenCalledWith('/custom-page')
    })

    it('does not redirect when redirect option is false', async () => {
      mockDirectusAuth().withVersion('latest')

      await useDirectusAuth().login('user@example.com', 'secret', { redirect: false })

      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns the current user after login', async () => {
      mockDirectusAuth().withVersion('latest')

      const result = await useDirectusAuth().login('user@example.com', 'secret')

      expect(result).toStrictEqual(mockUser)
    })
  })

  describe('loginWithProvider', () => {
    it('navigates externally to the Directus SSO endpoint with encoded redirect', async () => {
      await useDirectusAuth().loginWithProvider('google')

      expect(navigateToMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login/google'),
        { external: true },
      )
      expect(navigateToMock).toHaveBeenCalledWith(
        expect.stringContaining('redirect='),
        { external: true },
      )
    })

    it('uses auth.redirect.login as redirect path when redirectOnLogin is true', async () => {
      await useDirectusAuth().loginWithProvider('google', true)

      expect(navigateToMock).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('/auth/login')),
        { external: true },
      )
    })

    it('uses current href as redirect path when redirectOnLogin is false', async () => {
      useRequestURLMock.mockReturnValue({ origin: 'http://localhost:3000', href: 'http://localhost:3000/page' })

      await useDirectusAuth().loginWithProvider('google', false)

      // When redirectOnLogin is false, uses href as redirect path (the redirect= param is present)
      expect(navigateToMock).toHaveBeenCalledWith(
        expect.stringContaining('redirect='),
        { external: true },
      )
    })

    it('uses the provided string as redirect path when redirectOnLogin is a string', async () => {
      await useDirectusAuth().loginWithProvider('google', '/after-login')

      expect(navigateToMock).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('http://localhost:3000/after-login')),
        { external: true },
      )
    })

    it('strips trailing slash from the redirect URL', async () => {
      useRequestURLMock.mockReturnValue({ origin: 'http://localhost:3000/', href: 'http://localhost:3000/' })

      await useDirectusAuth().loginWithProvider('google', '/auth/login')

      // The encoded redirect should not end with a trailing slash
      expect(navigateToMock).toHaveBeenCalledWith(
        expect.not.stringMatching(/redirect=.*\/$/),
        { external: true },
      )
    })
  })

  describe('logout', () => {
    it('calls directus.logout and clears user.value', async () => {
      mockDirectusAuth().withVersion('latest')
      useDirectusUser().value = mockUser as unknown as DirectusUser

      await useDirectusAuth().logout(false)

      expect(logoutMock).toHaveBeenCalledOnce()
      expect(useDirectusUser().value).toBeNull()
    })

    it('clears user.value even when directus.logout throws', async () => {
      logoutMock.mockRejectedValue(new Error('Session expired'))
      useDirectusUser().value = mockUser as unknown as DirectusUser

      // The error propagates from the finally block - we expect it and still check state
      await useDirectusAuth().logout(false).catch(() => {})

      expect(useDirectusUser().value).toBeNull()
    })

    it('redirects to auth.redirect.logout after logout by default', async () => {
      mockDirectusAuth().withVersion('latest')

      await useDirectusAuth().logout()

      expect(navigateToMock).toHaveBeenCalledWith('/')
    })

    it('falls back to auth.redirect.login when logout redirect is not configured', async () => {
      mockDirectusAuth().withVersion('latest')
      // Remove logout from redirect config so it falls back to login
      mockRuntimeConfig.public.directus.auth.redirect = {
        home: '/home',
        login: '/login',
        logout: undefined as unknown as string,
      }

      await useDirectusAuth().logout()

      expect(navigateToMock).toHaveBeenCalledWith('/login')
    })

    it('redirects to the provided RouteLocationRaw when given', async () => {
      mockDirectusAuth().withVersion('latest')

      await useDirectusAuth().logout('/goodbye')

      expect(navigateToMock).toHaveBeenCalledWith('/goodbye')
    })

    it('does not redirect when redirect is false', async () => {
      mockDirectusAuth().withVersion('latest')

      await useDirectusAuth().logout(false)

      expect(navigateToMock).not.toHaveBeenCalled()
    })
  })

  describe('createUser / register', () => {
    it('createUser forwards RegisterUserInput to the SDK and returns the created user', async () => {
      requestMock.mockResolvedValue(mockUser)

      const result = await useDirectusAuth().createUser({ email: 'new@example.com', password: 'pass' })

      expect(createUserSdkMock).toHaveBeenCalledWith({ email: 'new@example.com', password: 'pass' })
      expect(result).toStrictEqual(mockUser)
    })

    it('register is an alias for createUser and produces the same result', async () => {
      requestMock.mockResolvedValue(mockUser)

      const result = await useDirectusAuth().register({ email: 'new@example.com', password: 'pass' })

      expect(result).toStrictEqual(mockUser)
    })
  })

  describe('inviteUser', () => {
    it('calls the SDK inviteUser with email, role, and optional inviteUrl', async () => {
      requestMock.mockResolvedValue(undefined)

      await useDirectusAuth().inviteUser('invite@example.com', 'role-id', 'https://app.example.com/accept')

      expect(inviteUserSdkMock).toHaveBeenCalledWith(
        'invite@example.com',
        'role-id',
        'https://app.example.com/accept',
      )
    })
  })

  describe('acceptUserInvite', () => {
    it('calls the SDK acceptUserInvite with token and password', async () => {
      requestMock.mockResolvedValue(undefined)

      await useDirectusAuth().acceptUserInvite('invite-token-abc', 'newpass123')

      expect(acceptUserInviteSdkMock).toHaveBeenCalledWith('invite-token-abc', 'newpass123')
    })
  })

  describe('passwordRequest', () => {
    it('calls the SDK passwordRequest with email and optional resetUrl', async () => {
      requestMock.mockResolvedValue(undefined)

      await useDirectusAuth().passwordRequest('user@example.com', 'https://app.example.com/reset')

      expect(passwordRequestSdkMock).toHaveBeenCalledWith(
        'user@example.com',
        'https://app.example.com/reset',
      )
    })

    it('calls passwordRequest without resetUrl when not provided', async () => {
      requestMock.mockResolvedValue(undefined)

      await useDirectusAuth().passwordRequest('user@example.com')

      expect(passwordRequestSdkMock).toHaveBeenCalledWith('user@example.com', undefined)
    })
  })

  describe('passwordReset', () => {
    it('calls the SDK passwordReset with token and password', async () => {
      requestMock.mockResolvedValue(undefined)

      await useDirectusAuth().passwordReset('reset-token-xyz', 'newpassword123')

      expect(passwordResetSdkMock).toHaveBeenCalledWith('reset-token-xyz', 'newpassword123')
    })
  })
})
