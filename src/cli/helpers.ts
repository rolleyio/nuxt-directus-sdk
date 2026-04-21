/**
 * Small pure helpers used by the CLI entry. Kept in their own file so they can
 * be unit-tested without spawning a subprocess or loading the main CLI with
 * its top-level `loadEnv` side effect.
 */

/**
 * Parse a comma-separated string into a trimmed, non-empty string array.
 *
 * @example
 *   parseCsv(undefined) // []
 *   parseCsv('') // []
 *   parseCsv('a') // ['a']
 *   parseCsv('a, b ,c') // ['a', 'b', 'c']
 *   parseCsv('a,,b') // ['a', 'b']
 */
export function parseCsv(raw: string | undefined): string[] {
  if (!raw)
    return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Resolve a boolean flag that has both `--flag` and `--no-flag` forms.
 *
 * Node's `parseArgs` does not natively support the `--no-X` convention, so we
 * register both forms and this helper picks the winner. Negation always wins:
 * if the user passes `--no-flag`, the result is `false`, regardless of whether
 * `--flag` was also passed.
 */
export function resolveNegatableBoolean(
  positive: boolean | undefined,
  negative: boolean | undefined,
  fallback: boolean,
): boolean {
  if (negative)
    return false
  if (positive !== undefined)
    return positive
  return fallback
}
