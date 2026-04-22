---
outline: deep
---

# `rules:*`

Pull, push, and diff Directus permissions, policies, and roles as JSON. Pairs with the [Rules Sync guide](/guide/rules-sync), which covers the full workflow of defining rules in code, testing them, and syncing to your Directus instance.

Connection settings (URL / admin token) are the same as every other CLI command. See the [CLI overview](/cli/) for precedence.

## Commands

### `rules:pull`

Download the current Directus permissions/policies/roles to a JSON file.

```bash
# Pull to rules.json (default output path)
npx nuxt-directus-sdk rules:pull

# Pull to a specific file
npx nuxt-directus-sdk rules:pull -o staging-rules.json

# Pull from a specific instance
npx nuxt-directus-sdk rules:pull \
  --url https://staging.example.com \
  --token $STAGING_TOKEN
```

**Flags:**

| Flag | Default | Description |
| --- | --- | --- |
| `-o, --output <file>` | `rules.json` | Output file path |
| `--compact` | `false` | Output compact JSON without pretty-printing |

### `rules:push`

Push a local JSON rules file to Directus.

```bash
# Preview what would change (dry run, never writes)
npx nuxt-directus-sdk rules:push rules.json --dry-run

# Push the rules
npx nuxt-directus-sdk rules:push rules.json

# Only add new items, never modify or delete existing ones
npx nuxt-directus-sdk rules:push rules.json --add-only

# Skip deletions (useful for additive migrations)
npx nuxt-directus-sdk rules:push rules.json --skip-deletes
```

**Flags:**

| Flag | Default | Description |
| --- | --- | --- |
| `--dry-run` | `false` | Report what would be changed, don't actually change anything |
| `--add-only` | `false` | Only create new items, never modify or delete existing items |
| `--skip-deletes` | `false` | Don't delete items that exist remotely but not locally |

### `rules:diff`

Compare a local JSON file against a Directus instance.

```bash
npx nuxt-directus-sdk rules:diff rules.json
```

Exits with code 1 if differences are found, so you can use it as a CI gate:

```yaml
# .github/workflows/rules-drift.yml
- name: Check for rule drift
  run: npx nuxt-directus-sdk rules:diff rules.json
```

The job fails if remote Directus has drifted from what's checked into the repo.

### `rules:diff-files`

Compare two local JSON files.

```bash
npx nuxt-directus-sdk rules:diff-files staging.json production.json
```

Useful when you've pulled from two instances and want to see what's different.

### `rules:diff-remote`

Compare two Directus instances directly.

```bash
npx nuxt-directus-sdk rules:diff-remote \
  --source-url https://staging.example.com --source-token staging-token \
  --target-url https://production.example.com --target-token production-token
```

**Flags:**

| Flag | Description |
| --- | --- |
| `--source-url <url>` | URL of the source Directus instance |
| `--source-token <token>` | Admin token for the source instance |
| `--target-url <url>` | URL of the target Directus instance |
| `--target-token <token>` | Admin token for the target instance |

## See also

- [Rules Sync guide](/guide/rules-sync) — full workflow including the code-first authoring API
- [Defining Rules](/guide/rules) — reference for the rules DSL
- [Testing Rules](/guide/rules-testing) — test utilities for verifying rule behaviour
- [CLI overview](/cli/) — connection settings, exit codes
