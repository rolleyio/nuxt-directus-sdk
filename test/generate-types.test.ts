import * as directusSdk from '@directus/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateTypesFromDirectus } from '../src/runtime/types/generate'
import { mockDirectusRequest, requestMock } from './fixtures/directus-sdk/request/with-directus-version.mock'

vi.mock('@directus/sdk', async () => {
  const { requestMock } = await import('./fixtures/directus-sdk/request/with-directus-version.mock')

  return {
    createDirectus: vi.fn(() => {
      let token: 'admin' | 'not_admin' | 'empty' | null = null
      return {
        with(arg: any) {
          if (arg?.__type === 'staticToken')
            token = arg.token
          return this
        },
        request(query: any) {
          return requestMock(query, token)
        },
      }
    }),
    rest: vi.fn(() => ({})),
    staticToken: vi.fn((t: string) => ({ __type: 'staticToken', token: t })),
    isDirectusError: vi.fn(() => false),
    readFields: vi.fn(() => 'readFields'),
    readCollections: vi.fn(() => 'readCollections'),
    readRelations: vi.fn(() => 'readRelations'),
  }
})

describe('generateTypesFromDirectus()', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('logs network failure to present to user', async () => {
    requestMock.mockRejectedValue(new Error('Network error'))
    const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App')
    expect(result.typeString).toBe('')
    expect(result.logs).toBeInstanceOf(Array)
    expect(result.logs[0]).toContain('  - Unexpected error: Network error')
  })
  it('logs directus errors to present to user', async () => {
    vi.spyOn(directusSdk, 'isDirectusError').mockReturnValue(true)
    requestMock.mockRejectedValue({
      errors: [
        {
          message: 'UniqueMessage',
          extensions: { code: 'FORBIDDEN' },
        },
      ],
    })
    const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App')
    expect(result.typeString).toBe('')
    expect(result.logs).toBeInstanceOf(Array)
    expect(result.logs[0]).toContain('  - Directus error [FORBIDDEN] UniqueMessage')
  })

  describe('returns', () => {
    it('nuxt compatible type string', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App')
      expect(result.typeString).toMatch(/^declare global \{/)
      expect(result.typeString).toMatch(/export \{\};\s*$/)
    })
    it('logs as array of strings', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App')
      expect(result.logs).toBeInstanceOf(Array)
      result.logs.forEach(log => expect(typeof log).toBe('string'))
    })
  })

  describe('with prefixes', () => {
    it('applied to non-directus interfaces', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App')
      expect(result.typeString).toContain('interface AppPost')
      expect(result.typeString).toContain('interface AppAiPrompt')
    })
    it('not applied to directus interfaces', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App')
      // System collection names appear as type references (e.g. DirectusUser | string | null)
      // but never with the App prefix
      expect(result.typeString).toContain('DirectusUser')
      expect(result.typeString).not.toContain('AppDirectusUser')
    })
  })

  describe('applies jsdoc comments', () => {
    it('for @primaryKey', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App')
      expect(result.typeString).toContain('@primaryKey')
    })
    it('for @required', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App')
      // ai_prompts.name has required: true
      expect(result.typeString).toContain('@required')
    })
    it('for @description', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App')
      // ai_prompts.name has note: 'Unique name for the prompt...'
      expect(result.typeString).toContain('@description')
    })
  })

  describe('supports directus-extensions', () => {
    it.todo('with multiple matches')
    describe('seo-plugin', () => {
      it('without prefix', async () => {
        mockDirectusRequest().directusVersion('latest')
        const result = await generateTypesFromDirectus('http://localhost', 'admin', '')
        expect(result.typeString).toContain('interface DirectusLabsSeoPlugin')
      })
      it('with prefix', async () => {
        mockDirectusRequest().directusVersion('latest')
        const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App')
        expect(result.typeString).toContain('interface AppDirectusLabsSeoPlugin')
      })
    })
  })
})
