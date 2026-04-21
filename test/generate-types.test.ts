import * as directusSdk from '@directus/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FALLBACK_TYPE_STRING, generateTypesFromDirectus } from '../src/runtime/types/generate'
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
    expect(result.typeString).toBe(FALLBACK_TYPE_STRING)
    expect(result.logs).toBeInstanceOf(Array)
    expect(result.logs[0]).toContain('  - Error: Network error')
  })
  it('returns fallback and logs error when collections, fields, or relations are empty', async () => {
    mockDirectusRequest().directusVersion('latest')
    const result = await generateTypesFromDirectus('http://localhost', 'empty', 'App')
    expect(result.typeString).toBe(FALLBACK_TYPE_STRING)
    expect(result.logs.some(log => log.toLowerCase().includes('error'))).toBe(true)
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
    expect(result.typeString).toBe(FALLBACK_TYPE_STRING)
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

  describe('with exclude', () => {
    it('omits the excluded collection interface', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App', ['ai_prompts'])
      expect(result.typeString).not.toContain('interface AppAiPrompt ')
    })

    it('omits the excluded collection from DirectusSchema', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App', ['ai_prompts'])
      expect(result.typeString).not.toMatch(/ai_prompts: AppAiPrompt\[\]/)
    })

    it('omits the excluded collection from the CollectionNames enum', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App', ['ai_prompts'])
      expect(result.typeString).not.toContain(`ai_prompts = 'ai_prompts'`)
    })

    it('rewrites M2O references to excluded types as `string`', async () => {
      // directus_users is referenced by user_created / user_updated on many collections;
      // when excluded, those fields should become `string | null`, not `DirectusUser | string | null`
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App', ['directus_users'])
      expect(result.typeString).not.toContain('DirectusUser')
    })

    it('rewrites O2M references to excluded types as `string[]`', async () => {
      // directus_files is referenced by file/files fields on several collections;
      // excluding it should keep the generated types valid (no dangling DirectusFile references)
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App', ['directus_files'])
      expect(result.typeString).not.toContain('DirectusFile ')
      expect(result.typeString).not.toContain('DirectusFile[]')
      expect(result.typeString).not.toContain('DirectusFile | ')
    })

    it('excluding multiple collections removes all of them', async () => {
      mockDirectusRequest().directusVersion('latest')
      const result = await generateTypesFromDirectus('http://localhost', 'admin', 'App', ['ai_prompts', 'directus_users'])
      expect(result.typeString).not.toContain('interface AppAiPrompt ')
      expect(result.typeString).not.toContain('DirectusUser')
    })

    it('empty exclude array matches default behaviour', async () => {
      mockDirectusRequest().directusVersion('latest')
      const [withEmpty, withDefault] = await Promise.all([
        generateTypesFromDirectus('http://localhost', 'admin', 'App', []),
        generateTypesFromDirectus('http://localhost', 'admin', 'App'),
      ])
      expect(withEmpty.typeString).toBe(withDefault.typeString)
    })

    it('excluding an unknown collection is a no-op', async () => {
      mockDirectusRequest().directusVersion('latest')
      const [withUnknown, withoutUnknown] = await Promise.all([
        generateTypesFromDirectus('http://localhost', 'admin', 'App', ['collection_that_does_not_exist']),
        generateTypesFromDirectus('http://localhost', 'admin', 'App'),
      ])
      expect(withUnknown.typeString).toBe(withoutUnknown.typeString)
    })
  })
})
