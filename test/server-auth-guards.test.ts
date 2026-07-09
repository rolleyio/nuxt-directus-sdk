import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const request = vi.fn()
  const client = {
    request,
    setToken: vi.fn(),
    with: vi.fn(),
  }
  client.with.mockImplementation(() => client)

  return {
    client,
    createDirectus: vi.fn(() => client),
    getCookie: vi.fn(),
    readMe: vi.fn(() => ({ command: 'readMe' })),
    readPolicyGlobals: vi.fn(() => ({ command: 'readPolicyGlobals' })),
    request,
  }
})

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn(() => ({
    public: { directus: { url: 'https://directus.example.com' } },
    directus: { serverDirectusUrl: '', adminToken: '' },
  })),
}))

vi.mock('@directus/sdk', () => ({
  authentication: vi.fn(() => ({ type: 'authentication' })),
  createDirectus: mocks.createDirectus,
  readMe: mocks.readMe,
  readPolicyGlobals: mocks.readPolicyGlobals,
  rest: vi.fn(() => ({ type: 'rest' })),
}))

vi.mock('h3', () => ({
  createError: vi.fn((input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input)),
  getCookie: mocks.getCookie,
}))

describe('server auth guards', () => {
  beforeEach(() => {
    mocks.getCookie.mockReset()
    mocks.request.mockReset()
    mocks.client.setToken.mockClear()
  })

  it('rejects a missing session with 401', async () => {
    mocks.getCookie.mockReturnValue(undefined)
    const { requireDirectusUser } = await import('../src/runtime/server/services/directus')

    await expect(requireDirectusUser({} as never)).rejects.toMatchObject({ statusCode: 401 })
    expect(mocks.request).not.toHaveBeenCalled()
  })

  it('returns the authenticated user', async () => {
    mocks.getCookie.mockReturnValue('session-token')
    mocks.request.mockResolvedValueOnce({ id: 'user-1', email: 'user@example.com' })
    const { requireDirectusUser } = await import('../src/runtime/server/services/directus')

    await expect(requireDirectusUser({} as never)).resolves.toMatchObject({ id: 'user-1' })
    expect(mocks.client.setToken).toHaveBeenCalledWith('session-token')
  })

  it('maps an invalid session response to 401', async () => {
    mocks.getCookie.mockReturnValue('expired-token')
    mocks.request.mockRejectedValueOnce(new Error('Invalid token'))
    const { requireDirectusUser } = await import('../src/runtime/server/services/directus')

    await expect(requireDirectusUser({} as never)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('allows users with effective admin access', async () => {
    mocks.getCookie.mockReturnValue('admin-token')
    mocks.request
      .mockResolvedValueOnce({ id: 'admin-1' })
      .mockResolvedValueOnce({ admin_access: true, app_access: true, enforce_tfa: false })
    const { requireDirectusAdmin } = await import('../src/runtime/server/services/directus')

    await expect(requireDirectusAdmin({} as never)).resolves.toMatchObject({ id: 'admin-1' })
    expect(mocks.readPolicyGlobals).toHaveBeenCalledOnce()
  })

  it('rejects non-admin users even when their role is named Administrator', async () => {
    mocks.getCookie.mockReturnValue('user-token')
    mocks.request
      .mockResolvedValueOnce({ id: 'user-1', role: { name: 'Administrator' } })
      .mockResolvedValueOnce({ admin_access: false, app_access: true, enforce_tfa: false })
    const { requireDirectusAdmin } = await import('../src/runtime/server/services/directus')

    await expect(requireDirectusAdmin({} as never)).rejects.toMatchObject({ statusCode: 403 })
  })
})
