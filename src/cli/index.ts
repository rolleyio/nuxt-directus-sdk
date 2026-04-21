#!/usr/bin/env node
/**
 * nuxt-directus-sdk CLI
 *
 * Commands:
 *   rules:pull         - Download rules from Directus and save as JSON
 *   rules:push         - Push local JSON rules to remote Directus
 *   rules:diff         - Compare local rules with remote Directus
 *   rules:diff-files   - Compare two local JSON files
 *   rules:diff-remote  - Compare two remote Directus instances
 *   generate-types     - Generate TypeScript types from a Directus schema
 */

/* eslint-disable node/prefer-global/process */

import type { DirectusRulesPayload } from '../rules/types/directus-api'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { createDirectus, rest, staticToken } from '@directus/sdk'
import { loadRulesFromPayload } from '../rules/loaders'
import {
  compareRulesPayloads,
  diffRemoteRules,
  fetchRemoteRules,
  fetchRemoteRulesAsJson,
  formatDiff,
  formatPushResult,
  pushRules,
} from '../rules/sync'
import { generateTypesFromDirectus } from '../runtime/types/generate'

interface ConnectionConfig {
  url: string
  token: string
}

// Load .env file if it exists
function loadEnv(): void {
  const envPath = resolve(process.cwd(), '.env')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#'))
        continue
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  }
}

/**
 * Get connection config, with CLI flags taking precedence over env vars
 */
function getConnectionConfig(
  urlFlag: string | undefined,
  tokenFlag: string | undefined,
  label: string,
): ConnectionConfig {
  const url = urlFlag ?? process.env.DIRECTUS_URL
  const token = tokenFlag ?? process.env.DIRECTUS_ADMIN_TOKEN

  if (!url) {
    console.error(`Error: ${label} URL is required`)
    const flagHint = label === 'Source'
      ? '--url (or --source-url)'
      : `--${label.toLowerCase()}-url`
    console.error(`Provide ${flagHint} or set DIRECTUS_URL in your .env file`)
    process.exit(1)
  }

  if (!token) {
    console.error(`Error: ${label} token is required`)
    const flagHint = label === 'Source'
      ? '--token (or --source-token)'
      : `--${label.toLowerCase()}-token`
    console.error(`Provide ${flagHint} or set DIRECTUS_ADMIN_TOKEN in your .env file`)
    process.exit(1)
  }

  return { url, token }
}

function createClient(url: string, token: string) {
  return createDirectus(url)
    .with(staticToken(token))
    .with(rest())
}

function printHelp(): void {
  console.log(`
nuxt-directus-sdk CLI

Usage:
  npx nuxt-directus-sdk <command> [options]

Commands:
  rules:pull                Download rules from Directus and save as JSON
  rules:push <file>         Push local JSON rules to remote Directus
  rules:diff <file>         Compare local JSON file with remote Directus
  rules:diff-files <a> <b>  Compare two local JSON files
  rules:diff-remote         Compare two remote Directus instances
  generate-types            Generate TypeScript types from a Directus schema

Options:
  -h, --help                Show this help message
  -o, --output <file>       Output file path (default: stdout for generate-types, rules.json for rules:pull)
  --compact                 Output compact JSON (no pretty-print)
  --dry-run                 Show what would be changed without making changes (rules:push)
  --add-only                Only add new items, don't modify or delete existing (rules:push)
  --skip-deletes            Skip deleting items that exist remotely but not locally (rules:push)
  --prefix <prefix>         Prefix for custom collection type names (generate-types)
  --include <names>         Comma-separated collection names to include (generate-types).
                            When set, only these collections are emitted; references to
                            collections not in the list are rewritten to \`string\`.
                            Takes precedence over --exclude if both are set.
  --exclude <names>         Comma-separated collection names to exclude (generate-types).
                            References to excluded types are rewritten to \`string\`.
  --verbose                 Show per-target warnings listing every field whose reference
                            was collapsed to \`string\` (generate-types).
  --no-declare-global       Emit types without the \`declare global\` wrapper (generate-types)

  Connection options (override DIRECTUS_URL / DIRECTUS_ADMIN_TOKEN):
  --url <url>               Directus URL (alias of --source-url)
  --token <token>           Admin token (alias of --source-token)
  --source-url <url>        Source Directus URL
  --source-token <token>    Source admin token
  --target-url <url>        Target Directus URL (for rules:diff-remote)
  --target-token <token>    Target admin token (for rules:diff-remote)

Environment Variables:
  DIRECTUS_URL              Default Directus URL (used if --url / --source-url not provided)
  DIRECTUS_ADMIN_TOKEN      Default admin token (used if --token / --source-token not provided)

Examples:
  # Pull rules from Directus (uses env vars)
  npx nuxt-directus-sdk rules:pull

  # Pull from a specific instance
  npx nuxt-directus-sdk rules:pull --source-url https://my-directus.com --source-token my-token

  # Preview what would be pushed (dry run)
  npx nuxt-directus-sdk rules:push rules.json --dry-run

  # Push rules to Directus
  npx nuxt-directus-sdk rules:push rules.json

  # Push only new items (safe mode)
  npx nuxt-directus-sdk rules:push rules.json --add-only

  # Compare local file with remote
  npx nuxt-directus-sdk rules:diff rules.json

  # Compare two local JSON files
  npx nuxt-directus-sdk rules:diff-files staging.json production.json

  # Compare two remote instances
  npx nuxt-directus-sdk rules:diff-remote \\
    --source-url https://staging.example.com --source-token staging-token \\
    --target-url https://production.example.com --target-token production-token

  # Generate TypeScript types, pipe to a file
  npx nuxt-directus-sdk generate-types > types/directus.d.ts

  # Generate types with a prefix, write directly to a file
  npx nuxt-directus-sdk generate-types --prefix App -o types/directus.d.ts

  # Generate types from a specific instance
  npx nuxt-directus-sdk generate-types --url https://my-directus.com --token my-token

  # Exclude specific collections — references to them become \`string\`
  npx nuxt-directus-sdk generate-types --exclude directus_activity,directus_revisions

  # Include only specific collections (allow-list; references to others collapse to \`string\`)
  npx nuxt-directus-sdk generate-types --include posts,pages,directus_users

  # Verbose — show every field whose reference was collapsed, grouped by target
  npx nuxt-directus-sdk generate-types --exclude directus_users --verbose
`)
}

function loadJsonFile(filePath: string): DirectusRulesPayload {
  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`)
    process.exit(1)
  }

  const content = readFileSync(filePath, 'utf-8')
  try {
    return JSON.parse(content)
  }
  catch {
    console.error(`Error: Invalid JSON in ${filePath}`)
    process.exit(1)
  }
}

async function commandPull(
  options: { output: string, compact: boolean },
  connection: ConnectionConfig,
): Promise<void> {
  const client = createClient(connection.url, connection.token)

  console.log(`Fetching rules from ${connection.url}...`)

  const json = await fetchRemoteRulesAsJson(client, !options.compact)

  writeFileSync(options.output, json)
  console.log(`Rules saved to ${options.output}`)

  // Parse and show summary
  const rules: DirectusRulesPayload = JSON.parse(json)
  console.log(`  ${rules.roles.length} roles`)
  console.log(`  ${rules.policies.length} policies`)
  console.log(`  ${rules.permissions.length} permissions`)
}

async function commandDiff(
  localFile: string,
  connection: ConnectionConfig,
): Promise<void> {
  const local = loadJsonFile(localFile)

  console.log(`Comparing ${localFile} with ${connection.url}...`)

  const client = createClient(connection.url, connection.token)
  const remote = await fetchRemoteRules(client)
  const diff = compareRulesPayloads(local, remote)

  console.log()
  console.log(formatDiff(diff))

  if (diff.hasChanges) {
    process.exit(1) // Exit with error code if there are differences
  }
}

async function commandDiffFiles(fileA: string, fileB: string): Promise<void> {
  console.log(`Comparing ${fileA} with ${fileB}...`)

  const rulesA = loadJsonFile(fileA)
  const rulesB = loadJsonFile(fileB)

  const diff = compareRulesPayloads(rulesA, rulesB)

  console.log()
  console.log(formatDiff(diff))

  if (diff.hasChanges) {
    process.exit(1) // Exit with error code if there are differences
  }
}

async function commandDiffRemote(
  source: ConnectionConfig,
  target: ConnectionConfig,
): Promise<void> {
  console.log(`Comparing ${source.url} with ${target.url}...`)

  const sourceClient = createClient(source.url, source.token)
  const targetClient = createClient(target.url, target.token)

  const diff = await diffRemoteRules(sourceClient, targetClient)

  console.log()
  console.log(formatDiff(diff))

  if (diff.hasChanges) {
    process.exit(1) // Exit with error code if there are differences
  }
}

interface PushCommandOptions {
  dryRun: boolean
  addOnly: boolean
  skipDeletes: boolean
}

async function commandPush(
  localFile: string,
  connection: ConnectionConfig,
  options: PushCommandOptions,
): Promise<void> {
  const payload = loadJsonFile(localFile)
  const rules = loadRulesFromPayload(payload)

  const client = createClient(connection.url, connection.token)

  if (options.dryRun) {
    // Dry run: just show the diff
    console.log(`Dry run: comparing ${localFile} with ${connection.url}...`)
    const remote = await fetchRemoteRules(client)
    const diff = compareRulesPayloads(payload, remote)

    console.log()
    console.log(formatDiff(diff))

    if (!diff.hasChanges) {
      console.log('\nNo changes to push.')
    }
    else {
      console.log('\nRun without --dry-run to apply these changes.')
    }
    return
  }

  // Actual push
  console.log(`Pushing rules from ${localFile} to ${connection.url}...`)

  const result = await pushRules(client, rules, {
    addOnly: options.addOnly,
    skipDeletes: options.skipDeletes,
    onProgress: (event) => {
      const action = event.action === 'create' ? '+' : event.action === 'update' ? '~' : '-'
      console.log(`  [${event.current}/${event.total}] ${action} ${event.phase}: ${event.name}`)
    },
  })

  console.log()
  console.log(formatPushResult(result))

  if (!result.success) {
    process.exit(1)
  }
}

async function commandGenerateTypes(
  connection: ConnectionConfig,
  options: {
    prefix: string
    output: string | undefined
    declareGlobal: boolean
    include: string[]
    exclude: string[]
    verbose: boolean
  },
): Promise<void> {
  // Informational logs go to stderr so they don't pollute stdout when piping
  console.error(`Generating types from ${connection.url}...`)
  if (options.include.length > 0) {
    console.error(`Including collections: ${options.include.join(', ')}`)
  }
  if (options.exclude.length > 0) {
    console.error(`Excluding collections: ${options.exclude.join(', ')}`)
  }

  const { typeString, logs } = await generateTypesFromDirectus(
    connection.url,
    connection.token,
    options.prefix,
    {
      include: options.include,
      exclude: options.exclude,
      verbose: options.verbose,
    },
  )

  // Surface the generator's own logs (e.g. fetch counts, errors) to stderr
  for (const line of logs) {
    console.error(line)
  }

  if (!typeString) {
    console.error('Error: Type generation returned empty output.')
    process.exit(1)
  }

  // Strip the `declare global { ... }` wrapper for non-Nuxt consumers.
  // The wrapper spans the entire file: first line `declare global {`, last
  // body line `}`, followed by `export {};` which we also drop.
  const output = options.declareGlobal
    ? typeString
    : typeString
        .replace(/^declare global \{\n\n/, '')
        .replace(/\n\}\n\nexport \{\};?\n?$/, '\n')

  if (options.output) {
    const outputPath = resolve(process.cwd(), options.output)
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, output, 'utf-8')
    console.error(`Types written to ${outputPath}`)
  }
  else {
    process.stdout.write(output)
  }
}

async function main(): Promise<void> {
  loadEnv()

  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'help': { type: 'boolean', short: 'h' },
      // `output` has no default here — each command applies its own fallback
      // (rules:pull defaults to rules.json, generate-types defaults to stdout).
      'output': { type: 'string', short: 'o' },
      'compact': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      'add-only': { type: 'boolean', default: false },
      'skip-deletes': { type: 'boolean', default: false },
      'prefix': { type: 'string', default: '' },
      'include': { type: 'string' },
      'exclude': { type: 'string' },
      'verbose': { type: 'boolean', default: false },
      'declare-global': { type: 'boolean', default: true },
      'url': { type: 'string' },
      'token': { type: 'string' },
      'source-url': { type: 'string' },
      'source-token': { type: 'string' },
      'target-url': { type: 'string' },
      'target-token': { type: 'string' },
    },
  })

  if (values.help || positionals.length === 0) {
    printHelp()
    process.exit(0)
  }

  const command = positionals[0]

  try {
    switch (command) {
      case 'rules:pull': {
        const connection = getConnectionConfig(
          values['source-url'] ?? values.url,
          values['source-token'] ?? values.token,
          'Source',
        )
        await commandPull({
          output: values.output ?? 'rules.json',
          compact: values.compact!,
        }, connection)
        break
      }

      case 'rules:push': {
        if (!positionals[1]) {
          console.error('Error: rules:push requires a file path')
          console.error('Usage: npx nuxt-directus-sdk rules:push <file> [--dry-run]')
          process.exit(1)
        }
        const connection = getConnectionConfig(
          values['source-url'] ?? values.url,
          values['source-token'] ?? values.token,
          'Source',
        )
        await commandPush(positionals[1], connection, {
          dryRun: values['dry-run']!,
          addOnly: values['add-only']!,
          skipDeletes: values['skip-deletes']!,
        })
        break
      }

      case 'rules:diff': {
        if (!positionals[1]) {
          console.error('Error: rules:diff requires a file path')
          console.error('Usage: npx nuxt-directus-sdk rules:diff <file>')
          process.exit(1)
        }
        const connection = getConnectionConfig(
          values['source-url'] ?? values.url,
          values['source-token'] ?? values.token,
          'Source',
        )
        await commandDiff(positionals[1], connection)
        break
      }

      case 'rules:diff-files':
        if (!positionals[1] || !positionals[2]) {
          console.error('Error: rules:diff-files requires two file paths')
          console.error('Usage: npx nuxt-directus-sdk rules:diff-files <file-a> <file-b>')
          process.exit(1)
        }
        await commandDiffFiles(positionals[1], positionals[2])
        break

      case 'rules:diff-remote': {
        const source = getConnectionConfig(
          values['source-url'] ?? values.url,
          values['source-token'] ?? values.token,
          'Source',
        )
        const target = getConnectionConfig(
          values['target-url'],
          values['target-token'],
          'Target',
        )
        await commandDiffRemote(source, target)
        break
      }

      case 'generate-types': {
        const connection = getConnectionConfig(
          values.url ?? values['source-url'],
          values.token ?? values['source-token'],
          'Source',
        )
        const parseCsv = (raw: string | undefined) =>
          raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : []
        await commandGenerateTypes(connection, {
          prefix: values.prefix ?? '',
          output: values.output,
          declareGlobal: values['declare-global']!,
          include: parseCsv(values.include),
          exclude: parseCsv(values.exclude),
          verbose: values.verbose!,
        })
        break
      }

      default:
        console.error(`Unknown command: ${command}`)
        printHelp()
        process.exit(1)
    }
  }
  catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
    }
    else {
      console.error('An unknown error occurred')
    }
    process.exit(1)
  }
}

main()
