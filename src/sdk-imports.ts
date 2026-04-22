// Client factories / composables: module-level setup, not per-request commands.
// Also includes GraphQL exports — the module does not wrap or support GraphQL;
// keeping them as manual imports makes that boundary explicit.
const SDK_CLIENT_FACTORIES = new Set([
  'createDirectus',
  'rest',
  'graphql',
  'authentication',
  'staticToken',
  'realtime',
  'memoryStorage',
  'readGraphqlSdl',
])

// Realtime low-level internals not intended for direct use.
const SDK_REALTIME_INTERNALS = new Set([
  'auth',
  'pong',
  'sleep',
  'messageCallback',
])

// SDK internal utilities that are implementation details.
const SDK_INTERNALS = new Set([
  'throwIfEmpty',
  'throwIfCoreCollection',
  'getAuthEndpoint',
  'formatFields',
  'queryToParams',
])

// SDK functions already wrapped by this module's composables.
// auth.ts:    readMe, updateMe, createUser, inviteUser, acceptUserInvite, passwordRequest, passwordReset
// files.ts:   uploadFiles (composable handles FormData construction)
export const SDK_COMPOSABLE_WRAPPED = new Set([
  'readMe',
  'updateMe',
  'createUser',
  'inviteUser',
  'acceptUserInvite',
  'passwordRequest',
  'passwordReset',
  'uploadFiles',
])

export const SDK_DENYLIST = new Set([
  ...SDK_CLIENT_FACTORIES,
  ...SDK_REALTIME_INTERNALS,
  ...SDK_INTERNALS,
  ...SDK_COMPOSABLE_WRAPPED,
])

/**
 * Dynamically discovers available function exports from the Directus SDK.
 *
 * Filters out internal utilities, low-level APIs, and functions already wrapped
 * by this module, returning only user-facing SDK methods. Pass `userExclude` to
 * additionally suppress specific names (from the `autoImportSdk.exclude` option).
 *
 * @returns {string[]} A list of allowed SDK function names.
 */
export function discoverSdkImports(
  sdkModule: Record<string, unknown>,
  userExclude: Set<string> = new Set(),
): string[] {
  return Object.keys(sdkModule).filter(
    key => typeof sdkModule[key] === 'function' && !SDK_DENYLIST.has(key) && !userExclude.has(key),
  )
}
