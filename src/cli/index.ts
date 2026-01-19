#!/usr/bin/env node
/**
 * Directus Rules CLI
 *
 * Commands:
 *   rules:pull   - Download rules from Directus and save as JSON
 *   rules:diff   - Compare local rules with remote Directus
 *   rules:diff-remote - Compare two remote Directus instances
 */

import { createDirectus, rest, staticToken } from '@directus/sdk'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import {
  compareRulesPayloads,
  diffRemoteRules,
  fetchRemoteRules,
  fetchRemoteRulesAsJson,
  formatDiff,
} from '../rules/sync'
import type { DirectusRulesPayload } from '../rules/types/directus-api'

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

function getEnvConfig() {
  const url = process.env.DIRECTUS_URL
  const token = process.env.DIRECTUS_ADMIN_TOKEN

  if (!url) {
    console.error('Error: DIRECTUS_URL environment variable is required')
    console.error('Set it in your .env file or export it:')
    console.error('  export DIRECTUS_URL=https://your-directus.com')
    process.exit(1)
  }

  if (!token) {
    console.error('Error: DIRECTUS_ADMIN_TOKEN environment variable is required')
    console.error('Set it in your .env file or export it:')
    console.error('  export DIRECTUS_ADMIN_TOKEN=your-admin-token')
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
Directus Rules CLI

Usage:
  npx nuxt-directus-sdk <command> [options]

Commands:
  rules:pull              Download rules from Directus and save as JSON
  rules:diff <file>       Compare local JSON file with remote Directus
  rules:diff-remote       Compare two remote Directus instances

Options:
  -h, --help              Show this help message
  -o, --output <file>     Output file path (default: rules.json)
  --compact               Output compact JSON (no pretty-print)
  --target-url <url>      Target Directus URL (for rules:diff-remote)
  --target-token <token>  Target admin token (for rules:diff-remote)

Environment Variables:
  DIRECTUS_URL            Directus instance URL (required)
  DIRECTUS_ADMIN_TOKEN    Admin token for API access (required)

Examples:
  # Pull rules from Directus
  npx nuxt-directus-sdk rules:pull
  npx nuxt-directus-sdk rules:pull -o my-rules.json

  # Compare local file with remote
  npx nuxt-directus-sdk rules:diff rules.json

  # Compare staging with production
  DIRECTUS_URL=https://staging.example.com \\
  DIRECTUS_ADMIN_TOKEN=staging-token \\
  npx nuxt-directus-sdk rules:diff-remote \\
    --target-url https://production.example.com \\
    --target-token production-token
`)
}

async function commandPull(options: { output: string, compact: boolean }): Promise<void> {
  const { url, token } = getEnvConfig()
  const client = createClient(url, token)

  console.log(`Fetching rules from ${url}...`)

  const json = await fetchRemoteRulesAsJson(client, !options.compact)

  writeFileSync(options.output, json)
  console.log(`Rules saved to ${options.output}`)

  // Parse and show summary
  const rules: DirectusRulesPayload = JSON.parse(json)
  console.log(`  ${rules.roles.length} roles`)
  console.log(`  ${rules.policies.length} policies`)
  console.log(`  ${rules.permissions.length} permissions`)
}

async function commandDiff(localFile: string): Promise<void> {
  const { url, token } = getEnvConfig()

  if (!existsSync(localFile)) {
    console.error(`Error: File not found: ${localFile}`)
    process.exit(1)
  }

  const localContent = readFileSync(localFile, 'utf-8')
  let local: DirectusRulesPayload
  try {
    local = JSON.parse(localContent)
  }
  catch {
    console.error(`Error: Invalid JSON in ${localFile}`)
    process.exit(1)
  }

  console.log(`Comparing ${localFile} with ${url}...`)

  const client = createClient(url, token)
  const remote = await fetchRemoteRules(client)
  const diff = compareRulesPayloads(local, remote)

  console.log()
  console.log(formatDiff(diff))

  if (diff.hasChanges) {
    process.exit(1) // Exit with error code if there are differences
  }
}

async function commandDiffRemote(targetUrl: string, targetToken: string): Promise<void> {
  const { url: sourceUrl, token: sourceToken } = getEnvConfig()

  if (!targetUrl) {
    console.error('Error: --target-url is required for rules:diff-remote')
    process.exit(1)
  }

  if (!targetToken) {
    console.error('Error: --target-token is required for rules:diff-remote')
    process.exit(1)
  }

  console.log(`Comparing ${sourceUrl} with ${targetUrl}...`)

  const sourceClient = createClient(sourceUrl, sourceToken)
  const targetClient = createClient(targetUrl, targetToken)

  const diff = await diffRemoteRules(sourceClient, targetClient)

  console.log()
  console.log(formatDiff(diff))

  if (diff.hasChanges) {
    process.exit(1) // Exit with error code if there are differences
  }
}

async function main(): Promise<void> {
  loadEnv()

  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      output: { type: 'string', short: 'o', default: 'rules.json' },
      compact: { type: 'boolean', default: false },
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
      case 'rules:pull':
        await commandPull({
          output: values.output!,
          compact: values.compact!,
        })
        break

      case 'rules:diff':
        if (!positionals[1]) {
          console.error('Error: rules:diff requires a file path')
          console.error('Usage: npx nuxt-directus-sdk rules:diff <file>')
          process.exit(1)
        }
        await commandDiff(positionals[1])
        break

      case 'rules:diff-remote':
        await commandDiffRemote(
          values['target-url'] ?? '',
          values['target-token'] ?? '',
        )
        break

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
