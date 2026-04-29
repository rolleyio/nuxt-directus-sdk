import { vi } from 'vitest'
import { ref } from 'vue'

// Shared state store for useState - must be cleared in beforeEach
export const stateStore = new Map<string, ReturnType<typeof ref>>()

export function useStateMock(key: string, init: () => unknown) {
  if (!stateStore.has(key)) {
    stateStore.set(key, ref(init()))
  }
  return stateStore.get(key)!
}

// Mutable router state - tests set query to simulate route context
export const routerState = {
  query: {} as Record<string, string>,
}

export const navigateToMock = vi.fn()
export const useRouterMock = vi.fn(() => ({
  currentRoute: { value: { query: routerState.query } },
}))
export const useRequestURLMock = vi.fn(() => ({
  origin: 'http://localhost:3000',
  href: 'http://localhost:3000/',
}))

// Mutable config - tests mutate specific sub-keys, beforeEach resets them
export const mockRuntimeConfig = {
  public: {
    directus: {
      auth: {
        redirect: {
          home: '/',
          login: '/auth/login',
          logout: '/',
        },
        readMeFields: [] as string[],
      },
    },
  },
}

export function resetMockRuntimeConfig() {
  mockRuntimeConfig.public.directus.auth.redirect = {
    home: '/',
    login: '/auth/login',
    logout: '/',
  }
  mockRuntimeConfig.public.directus.auth.readMeFields = []
}
