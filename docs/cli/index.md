---
outline: deep
---

# CLI

The module ships with a CLI that covers the two operational tasks most projects need outside of `nuxi dev` / `nuxi build`: type generation and permissions/rules sync. Useful in CI, pre-commit hooks, and quick regeneration during development.

```bash
npx nuxt-directus-sdk --help
```

## Commands

- **[`generate-types`](/cli/generate-types)** — generate TypeScript types from a Directus schema. Pairs with the [Type Generation](/guide/type-generation) feature.
- **[`rules:*`](/cli/rules)** — pull, push, and diff Directus permissions and policies as JSON. Pairs with the [Rules Sync](/guide/rules-sync) guide.

## Connection settings

Every command that talks to Directus reads the same two values:

| Setting | Flag | Environment variable | Notes |
| --- | --- | --- | --- |
| Directus URL | `--url <url>` | `DIRECTUS_URL` | `--source-url` is accepted as an alias |
| Admin token | `--token <token>` | `DIRECTUS_ADMIN_TOKEN` | `--source-token` is accepted as an alias |

Precedence: **CLI flag → exported/inline env var → `.env` file in the current directory**.

The CLI auto-loads a `.env` from the current working directory. Existing exported env vars win over the file, so inline overrides like `DIRECTUS_URL=https://other.example.com npx nuxt-directus-sdk …` work as expected.

## Exit codes

- **0** — success
- **1** — error (missing connection config, Directus returned an error, diff found differences, etc.)

CI pipelines can rely on exit codes to gate deploys on schema changes or rule drift.
