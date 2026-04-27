// FIXME: THESE TESTS DON'T ACTUALLY RUN UNTIL #72 IS ADDRESSED

/**
 * Type-level tests for known upstream bugs.
 *
 * Tests in this file PASS while the upstream bug exists and FAIL once it is
 * fixed — that failure is the signal to delete the test.
 */
import { readSingleton } from '@directus/sdk'
import { describe, it } from 'vitest'
import { useDirectus } from '../src/runtime/composables/directus'

describe('known issues upstream', () => {
  /**
   * Bug: https://github.com/directus/directus/pull/27196
   *
   * `readSingleton` should only accept user-defined singleton collections, but
   * currently also accepts system collection names like `'directus_settings'`.
   * This test passes while the bug exists. When the upstream fix ships,
   * `readSingleton('directus_settings')` will become a type error here —
   * delete this test at that point.
   */
  it('readSingleton incorrectly accepts system collection "directus_settings" [delete when fixed]', () => {
    useDirectus().request(readSingleton('directus_settings'))
  })
})
