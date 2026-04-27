/**
 * Type-level tests for known upstream bugs.
 *
 * Tests in this file PASS while the upstream bug exists and FAIL once it is
 * fixed — that failure is the signal to delete the test.
 */
import { createDirectus, readItems, readSettings, readSingleton, rest } from '@directus/sdk'
import { describe, expectTypeOf, it } from 'vitest'

/**
 * Isolated schema used by the tests below. It deliberately includes
 * `directus_settings` as a non-array (singleton-shaped) entry alongside a
 * real user-defined singleton (`globals`) and a regular collection (`pages`).
 * This makes the test independent of the playground's global DirectusSchema.
 */
interface Pages {
  id: string
}
interface Globals {
  id: string
  title: string
}
interface IsolatedDirectusSettings {
  command_palette_settings: 'json'
}
interface IsolatedSchema {
  pages: Pages[]
  globals: Globals
  directus_settings: IsolatedDirectusSettings
}

const client = createDirectus<IsolatedSchema>('https://directus.example').with(rest())

describe('known issues upstream', () => {
  describe('directus/sdk pr#27196', () => {
  /**
   * Positive controls — these should remain valid after the upstream fix ships.
   */
    it('readItems accepts the regular collection "pages"', () => {
      expectTypeOf(client.request(readItems('pages'))).resolves.toEqualTypeOf<Pages[]>()
    })

    it('readSingleton accepts the user-defined singleton "globals"', () => {
      expectTypeOf(client.request(readSingleton('globals'))).resolves.toEqualTypeOf<Globals>()
    })

    it('readSettings is the correct API for directus_settings', () => {
      expectTypeOf(client.request(readSettings())).resolves.not.toBeNever()
    })

    /**
     * Bug: https://github.com/directus/directus/pull/27196
     *
     * `readSingleton` should only accept user-defined singleton collections.
     * When a schema includes `directus_settings` as a non-array entry,
     * `readSingleton` currently accepts it — but `readSettings()` is the
     * correct API for reading Directus system settings.
     *
     * This test passes while the bug exists. When PR #27196 ships,
     * `readSingleton('directus_settings')` will become a type error here —
     * delete this test at that point.
     */
    it('readSingleton incorrectly accepts system collection "directus_settings" [delete when fixed]', () => {
      client.request(readSingleton('directus_settings'))
    })
  })
})
