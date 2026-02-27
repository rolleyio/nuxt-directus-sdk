# Rules Sync

Sync your locally-defined rules with remote Directus instances. Pull existing rules, compare differences, and push changes -- from code or the CLI.

## CLI

The CLI is the quickest way to manage rules sync.

### Pull Rules

Download the current rules from Directus to a JSON file:

```bash
# Uses DIRECTUS_URL and DIRECTUS_ADMIN_TOKEN from .env
npx nuxt-directus-sdk rules:pull

# Or specify connection explicitly
npx nuxt-directus-sdk rules:pull --source-url https://directus.example.com --source-token my-token

# Custom output file
npx nuxt-directus-sdk rules:pull -o staging-rules.json
```

### Diff Rules

Compare a local rules file with a remote Directus instance:

```bash
npx nuxt-directus-sdk rules:diff rules.json
```

Compare two local files:

```bash
npx nuxt-directus-sdk rules:diff-files staging.json production.json
```

Compare two remote instances:

```bash
npx nuxt-directus-sdk rules:diff-remote \
  --source-url https://staging.example.com --source-token staging-token \
  --target-url https://production.example.com --target-token production-token
```

The diff output shows added (+), modified (~), and removed (-) items. The command exits with code 1 if there are differences, making it useful in CI pipelines.

### Push Rules

Push local rules to a remote Directus instance:

```bash
# Preview what would change (recommended first step)
npx nuxt-directus-sdk rules:push rules.json --dry-run

# Apply changes
npx nuxt-directus-sdk rules:push rules.json

# Only add new items, don't modify or delete existing ones
npx nuxt-directus-sdk rules:push rules.json --add-only

# Add and update, but don't delete items missing locally
npx nuxt-directus-sdk rules:push rules.json --skip-deletes
```

### Environment Variables

Instead of passing flags every time, set these in your `.env`:

```bash
DIRECTUS_URL=https://directus.example.com
DIRECTUS_ADMIN_TOKEN=your-admin-token
```

## Programmatic API

All CLI operations are available as functions.

### Fetching Remote Rules

```typescript
import { createDirectus, rest, staticToken } from '@directus/sdk'
import { fetchRemoteRules, pullRules } from 'nuxt-directus-sdk/rules'

const client = createDirectus('https://directus.example.com')
  .with(staticToken('your-token'))
  .with(rest())

// Get raw payload (roles, policies, permissions arrays)
const payload = await fetchRemoteRules(client)

// Or get as RulesConfig, ready for testing/extending
const rules = await pullRules(client)
```

### Diffing

```typescript
import {
  compareRulesPayloads,
  diffRules,
  diffRemoteRules,
  formatDiff,
  serializeToDirectusApi,
} from 'nuxt-directus-sdk/rules'

// Compare local rules with remote
const diff = await diffRules(client, localRules)

if (diff.hasChanges) {
  console.log(formatDiff(diff))
  // Or access structured data:
  console.log(diff.summary)
  // { roles: { added: 2, modified: 0, removed: 0 },
  //   policies: { added: 3, modified: 0, removed: 0 },
  //   permissions: { added: 7, modified: 0, removed: 0 } }
}

// Compare two payloads directly
const diff = compareRulesPayloads(localPayload, remotePayload)

// Compare two remote instances
const diff = await diffRemoteRules(stagingClient, productionClient)
```

### Pushing

```typescript
import { pushRules, formatPushResult } from 'nuxt-directus-sdk/rules'

const result = await pushRules(client, localRules, {
  // Only create, don't update or delete
  addOnly: false,

  // Don't delete items that exist remotely but not locally
  skipDeletes: false,

  // Progress callback
  onProgress: (event) => {
    console.log(`[${event.current}/${event.total}] ${event.action} ${event.phase}: ${event.name}`)
  },
})

console.log(formatPushResult(result))

if (!result.success) {
  console.error('Push failed:', result.errors)
}
```

Push applies changes in dependency order:

1. **Create/update:** policies -> roles -> permissions
2. **Delete:** permissions -> roles -> policies

### System Collection Handling

By default, diffs exclude internal Directus system collections (`directus_activity`, `directus_settings`, etc.) since these are managed by Directus itself. `directus_users` and `directus_files` are **not** excluded, since they commonly have custom permissions.

To include all system collections:

```typescript
const diff = compareRulesPayloads(local, remote, {
  excludeSystemCollections: false,
})
```

## Workflow Example

A typical workflow for managing rules across environments:

```bash
# 1. Pull current rules from staging
npx nuxt-directus-sdk rules:pull -o rules.json

# 2. Define/extend rules in code, test them (see Testing Rules guide)

# 3. Serialize your extended rules
#    (or use the JSON file directly)

# 4. Preview changes
npx nuxt-directus-sdk rules:push rules.json --dry-run

# 5. Apply to staging
npx nuxt-directus-sdk rules:push rules.json

# 6. Compare staging with production
npx nuxt-directus-sdk rules:diff-remote \
  --source-url https://staging.example.com --source-token staging-token \
  --target-url https://production.example.com --target-token production-token
```

### CI Integration

The diff command's exit code makes it easy to use in CI:

```yaml
# GitHub Actions example
- name: Check rules are in sync
  run: npx nuxt-directus-sdk rules:diff rules.json
  env:
    DIRECTUS_URL: ${{ secrets.DIRECTUS_URL }}
    DIRECTUS_ADMIN_TOKEN: ${{ secrets.DIRECTUS_ADMIN_TOKEN }}
```
