import { vi } from 'vitest'
import type { DirectusMajorVersion } from './versions'
import { mockUser } from './auth.data'

export const requestMock = vi.fn()
export const loginMock = vi.fn()
export const logoutMock = vi.fn()

// Spies for SDK command factories - lets tests assert call args
export const readMeSdkMock = vi.fn((...args: unknown[]) => args)
export const updateMeSdkMock = vi.fn((...args: unknown[]) => args)
export const createUserSdkMock = vi.fn((...args: unknown[]) => args)
export const inviteUserSdkMock = vi.fn((...args: unknown[]) => args)
export const acceptUserInviteSdkMock = vi.fn((...args: unknown[]) => args)
export const passwordRequestSdkMock = vi.fn((...args: unknown[]) => args)
export const passwordResetSdkMock = vi.fn((...args: unknown[]) => args)

/**
 * Sets up happy-path defaults for auth composable tests.
 * Individual tests override specific mocks for failure/edge-case scenarios.
 */
export function mockDirectusAuth() {
  return {
    withVersion(version: DirectusMajorVersion) {
      switch (version) {
        // NOTE: Always place newer versions on top.
        case 'latest':
        case 'v11':
          requestMock.mockResolvedValue(mockUser)
          loginMock.mockResolvedValue(undefined)
          logoutMock.mockResolvedValue(undefined)
          break
        default:
          throw new Error(`Function not implemented in mock.`)
      }
      return this
    },
  }
}
