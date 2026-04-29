---
outline: deep
---

# `generate-types`

Generate TypeScript types from a Directus schema. This is the standalone version of what the module's [Type Generation](/guide/type-generation) feature does automatically during `nuxi dev` / `nuxi build`. Useful in CI, pre-commit hooks, or any workflow where you want `.d.ts` output without a Nuxt build.

Connection settings (URL / admin token) are the same as every other CLI command. See the [CLI overview](/cli/) for precedence.

## Examples

```bash
# Pipe to a file (uses DIRECTUS_URL + DIRECTUS_ADMIN_TOKEN from .env)
npx nuxt-directus-sdk generate-types > types/directus.d.ts

# Write directly to a file (creates parent directories)
npx nuxt-directus-sdk generate-types -o types/directus.d.ts

# Inline env vars, useful for one-off runs against a specific instance
DIRECTUS_URL=https://my-directus.com \
DIRECTUS_ADMIN_TOKEN=my-token \
  npx nuxt-directus-sdk generate-types > types/directus.d.ts

# Flags override env vars
npx nuxt-directus-sdk generate-types \
  --url https://my-directus.com \
  --token $DIRECTUS_ADMIN_TOKEN \
  -o types/directus.d.ts

# Add a prefix to custom collection type names
npx nuxt-directus-sdk generate-types --prefix App -o types/directus.d.ts

# Emit without the `declare global { ... }` wrapper (non-Nuxt consumers)
npx nuxt-directus-sdk generate-types --no-declare-global -o types/directus.d.ts
```

## Flags

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `-o, --output <file>` | path | stdout | Output file. Parent directories are created automatically. |
| `--prefix <prefix>` | string | `''` | Prefix for custom collection type names (e.g. `App` produces `AppBlog`). System collection interfaces like `DirectusUser` are never prefixed. |
| `--no-declare-global` | boolean | wrapper on | Emit top-level `interface` declarations instead of wrapping everything in `declare global { ... }`. Useful for non-Nuxt consumers. |
| `--include <names>` | CSV | — | Emit only these collections (see [Filtering collections](#filtering-collections)). |
| `--exclude <names>` | CSV | — | Drop these collections (see [Filtering collections](#filtering-collections)). |
| `--no-expand-references` | boolean | expansion on | Disable reference expansion when `--include` is used (see below). |
| `--verbose` | boolean | `false` | Emit per-target grouped warnings for collapsed references. |

Informational logs (e.g. `Fetched 42 collections`) go to stderr, so they do not pollute stdout when piping.

::: tip Keeping types in version control
Running `generate-types` in CI and committing the output is a common pattern. It keeps your team working with consistent types without requiring each developer to have their own admin token or a local Nuxt build. Just make sure the CI job has access to the Directus instance and an admin token.
:::

## Filtering Collections <Badge type="warning" text="advanced" />

You can narrow what the CLI emits in the same way as the [module's `types` option](/api/configuration/module#types):

```bash
# Exclude
npx nuxt-directus-sdk generate-types --exclude directus_activity,directus_revisions

# Include (referenced collections auto-included)
npx nuxt-directus-sdk generate-types --include posts

# Strict include (only the listed collections; references collapse to `string`)
npx nuxt-directus-sdk generate-types --include posts --no-expand-references

# Verbose warnings, grouped by target collection
npx nuxt-directus-sdk generate-types --exclude directus_users --verbose
```

Precedence: when both `--include` and `--exclude` are set, `--include` wins and `--exclude` is ignored with a warning.

References to collections that are not emitted are rewritten so the generated types stay valid:

- M2O (e.g. `user_created: DirectusUser | string`) collapses to `string`
- O2M (e.g. `revisions: DirectusRevision[] | string[]`) collapses to `string[]`
- M2A (polymorphic) filters out missing collections from the union; if the whole union is missing, the field collapses to `string`

See the [Type Generation guide](/guide/type-generation#advanced-filtering-collections) for the full story with config-level examples.

## See Also

- [Type Generation guide](/guide/type-generation) — the feature-level overview
- [Module option: `types`](/api/configuration/module#types) — same behaviour in `nuxt.config.ts`
- [CLI overview](/cli/) — connection settings, exit codes
