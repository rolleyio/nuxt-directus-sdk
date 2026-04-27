import { describe, it } from 'vitest'

/**
 * Pending tests for useDirectusAuth and useDirectusUser composables @ src/runtime/composables/auth.ts
 *
 * Mocking requirements:
 *   - '#app': navigateTo, useRouter, useRuntimeConfig
 *   - '#imports': computed, useRequestURL, useState
 *   - './directus': useDirectus, useDirectusOriginUrl
 *   - '@directus/sdk': readMe, updateMe, createUser, inviteUser, acceptUserInvite, passwordRequest, passwordReset
 *
 * Note that some of the functions in the auth composable don't have catch blocks and that should probably be considerd
 *
 * TODO: Address in issue #63
 * https://github.com/rolleyio/nuxt-directus-sdk/issues/63
 */

describe('useDirectusUser', () => {
  it.todo('returns a Ref<DirectusUser | null> backed by useState key "directus.user"')
})

describe('useDirectusAuth', () => {
  describe('readMe', () => {
    it.todo('fetches the current user and sets user.value on success')
    it.todo('returns null and sets user.value = null when the SDK throws')
    it.todo('logs a warning when the response does not include an id field')
    it.todo('prevents concurrent calls — second call while loading returns current user.value without re-fetching')
    it.todo('passes configured readMeFields as fields query when non-empty')
    it.todo('passes no fields query when readMeFields is empty (SDK default returns all fields)')
  })

  describe('updateMe', () => {
    it.todo('throws "No user available" when user.value is null')
    it.todo('throws "No user available" when user.value has no id')
    it.todo('updates user.value with the SDK response and returns it')
    it.todo('passes configured readMeFields as fields query when non-empty')
    it.todo('passes no fields query when readMeFields is empty')
  })

  describe('login', () => {
    it.todo('calls directus.login with mode: session and then readMe')
    it.todo('redirects to auth.redirect.home by default after login')
    it.todo('redirects to the query.redirect param when present')
    it.todo('redirects to the provided RouteLocationRaw when redirect option is a non-boolean')
    it.todo('does not redirect when redirect option is false')
    it.todo('returns the current user after login')
  })

  describe('loginWithProvider', () => {
    it.todo('navigates externally to the Directus SSO endpoint with encoded redirect URL')
    it.todo('uses auth.redirect.login as redirect path when redirectOnLogin is true')
    it.todo('uses current href as redirect path when redirectOnLogin is false')
    it.todo('uses the provided string as redirect path when redirectOnLogin is a string')
    it.todo('strips trailing slash from the redirect URL')
  })

  describe('logout', () => {
    it.todo('calls directus.logout and clears user.value')
    it.todo('clears user.value even when directus.logout throws')
    it.todo('redirects to auth.redirect.logout after logout by default')
    it.todo('falls back to auth.redirect.login when logout redirect is not configured')
    it.todo('redirects to the provided RouteLocationRaw when given')
    it.todo('does not redirect when redirect is false')
  })

  describe('createUser / register', () => {
    it.todo('createUser forwards RegisterUserInput to the SDK and returns the created user')
    it.todo('register is an alias for createUser and produces the same result')
  })

  describe('inviteUser', () => {
    it.todo('calls the SDK inviteUser with email, role, and optional inviteUrl')
  })

  describe('acceptUserInvite', () => {
    it.todo('calls the SDK acceptUserInvite with token and password')
  })

  describe('passwordRequest', () => {
    it.todo('calls the SDK passwordRequest with email and optional resetUrl')
  })

  describe('passwordReset', () => {
    it.todo('calls the SDK passwordReset with token and password')
  })
})
