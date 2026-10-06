# Upgrading to v7

v7 moves the module to Directus 12. If you are still on Directus 11, stay on v6; it continues to receive fixes.

## Requirements

- **Directus 12** or later.
- **`@directus/sdk` 23** or later (v7 is developed against v26).
- Self-hosted Directus 12 defaults to the Core tier, which does not include SSO. See the [SSO license warning](/guide/authentication) before relying on `loginWithProvider`.
- Since Directus 12.1, WebSocket connections are checked against `CORS_ORIGIN`. Add your Nuxt app's origin if you use realtime.

```bash
pnpm add nuxt-directus-sdk@next @directus/sdk@latest
```

## Breaking changes

### `register()` uses public registration

`register()` used to be an alias for `createUser()` (`POST /users`), which needs create permission on users, so it failed for anonymous visitors. It now calls `POST /users/register`.

- Enable public registration in your Directus project settings.
- It accepts only `email`, `password`, `first_name`, `last_name` and `verification_url`.
- It returns `Promise<void>`, because Directus returns no body. Log the user in afterwards, or wait for email verification.
- Use `createUser()` for admin flows that need to set a role or other fields.

```ts
// v6
const user = await register({ email, password })

// v7
await register({ email, password })
await login(email, password)
```

### `rules:push` no longer deletes by default

Pushing a partial rules file used to delete every remote role, policy and permission missing from it. Pushes are now additive.

- CLI: pass `--delete` to remove remote-only items. `--skip-deletes` still works but does nothing, since it is now the default.
- `pushRules()`: `skipDeletes` now defaults to `true`. Pass `skipDeletes: false` to delete.
- The built-in Administrator and Public roles, and any policy with admin access, are never deleted, even with `--delete`. They show up as skipped in the push result.

### Auth middleware and redirects

- Pages with `definePageMeta({ middleware: 'guest' })` are now public when `enableGlobalAuthMiddleware` is on. Before, the global middleware still sent them to the login page.
- When the login page uses the `guest` middleware, logged-in users who open it are sent to `redirect.home`.
- The post-login `?redirect=` value keeps the query string and hash (`to.fullPath`).
- `?redirect=` only accepts same-origin paths. Absolute URLs, `//host` and backslash paths fall back to `redirect.home`.
- `loginWithProvider(provider, true)` now returns the user to `redirect.home` after SSO, not to the login page.

### Public runtime config

- `runtimeConfig.public.directus.url` is always the client URL string. With a split `url: { client, server }` config, the internal server URL is no longer sent to the browser.
- `NUXT_PUBLIC_DIRECTUS_URL` now overrides the client URL at runtime. The server uses it too unless a separate server URL is configured.

This only affects you if you read the module's runtime config directly.

### Rules DSL

- `rules:push --dry-run` and `rules:diff` now apply the same defaults as a real push (icons, `app_access` and so on), so their output can differ from v6. It now matches what `rules:push` would actually change.
- Diffs match local and remote roles and policies by name, so code-defined rules no longer show every permission as removed and re-added on each push.
- `normalizeRules()` and `serializeToDirectusApi()` no longer add generated `id`s to the policy objects you pass in.
- `DirectusPolicyPayload['ip_access']` is now `string | string[] | null`, to accept both the REST CSV form and the SDK's array form.

## New in v7

- [Data fetching composables](/guide/data-fetching): `useDirectusItems()`, `useDirectusItem()` and `useDirectusSingleton()`, plus cached Pinia Colada versions when `@pinia/colada` is installed.
- [Content versions](/guide/data-fetching#content-versions) in item and singleton reads.
- [`useDirectusSubscription()`](/guide/realtime) for realtime collections with automatic cleanup.
- [`requireDirectusUser()` and `requireDirectusAdmin()`](/guide/server-side#route-guards) for server routes.
- [Experimental data loaders](/guide/experimental-data-loaders), opt-in via `experimental.dataLoaders`.
