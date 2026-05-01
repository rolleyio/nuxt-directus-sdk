# Agents.md

This file provides guidance to AI coding assistants when working with the code in this repository.

> [!IMPORTANT]
> **Human In The Loop (HITL) is required.** You must pause and wait for human confirmation before taking any of the following actions:
> - Committing or pushing code
> - Running `lint:fix` (show the errors to be fixed and confirm first)
> - Opening a PR or any action visible outside the local environment
> - Any destructive operation (deleting files, force-pushing, dropping data)
>
> **If you are explicitly instructed to bypass HITL**, do so, but apply both of the following signals so PR reviewers can identify autonomous work:
> 1. Name the branch with an `agent/` prefix — e.g. `agent/add-auth-feature`
> 2. Include the following in every commit message made without a HITL checkpoint:
>    ```
>    🤖🤖🤖 Autonomous: user instructed "<quote the exact override instruction here>"
>    ```

**Think before Coding**

- State assumptions explicitly. If uncertain, prompt the user for clarification.
- If multiple interpretations exist, present them.
- If a simpler approach exists, say so. Push back when warranted.

**Simplicity First**

- No features beyond what was requested.
- No abstractions for single-use code.
- No "flexibility" or "configurability" if it was not requested.
- No error handling for impossible scenarios.
- If the code is 200 lines and it could be 50, rewrite it.

**Surgical Changes**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting. Instead, surface these to the user.
- Don't refactor things that aren't broken.
- Match existing style. Only suggest stylistic changes if there is a strong reason; don't impose training preferences.
- Unrelated dead code should not be deleted; instead notify the user.
- If changes cause orphans, remove imports/variables/functions that are now unused.

Every change made should trace directly to the user request.

**Goal Driven Execution**

Transform all tasks into verifiable goals:
- "Add validation" => "Write tests for invalid inputs and then make them pass"
- "Fix the bug" => "Write a test that reproduces it, then make it pass"
- "Refactor <X>" => "Ensure tests pass before and after"

For multi-step tasks, state the plan clearly as:
1. <step description> => <step goal> => <check>
2. <step description> => <step goal> => <check>
...

## Project Overview

nuxt-directus-sdk is a nuxt module that provides a wrapper for the @directus/sdk npm package that enables developers to quickly and easily get started with Directus in new and existing nuxt deployments. The module is intended to support current releases of [Directus](https://github.com/directus/directus/releases) prioritizing support for new features over legacy versions of Directus. The module contains the following scopes:

- **`/docs`** - VitePress documentation site
- **`/src/cli`** - CLI utilities (e.g. `generate-types`)
- **`/src/runtime`** - Nuxt module runtime: composables, components, middleware, plugins, server utilities

## Requirements

- Node.js 22 `lts/jod`
- pnpm >=10 <11
- TypeScript 6

## Coding Standards

### Branching Strategy

Commits to the `main` branch are discouraged, except in the case of a hot-fix. New features are deployed on the `next` branch. Create a new branch from `next` for all new features use semantic commit messages, are self-contained, and are tightly scoped to be reverted if an error is later discovered.

Branches created by an agent operating without HITL must use the `agent/` prefix — e.g. `agent/add-auth-feature`.

### Semantic Commit Messages

Use the following types:

| Type | When to use |
|------|-------------|
| `feat` | New feature or composable |
| `fix` | Bug fix |
| `chore` | Maintenance, dependency updates, tooling |
| `docs` | Documentation only |
| `refactor` | Code change with no behavior change |
| `test` | Adding or updating tests |
| `ci` | CI/CD configuration |
| `perf` | Performance improvement |

Format: `<type>(<optional scope>): <short description>`

### Code Comments

All exported functions and composables must have a JSDoc block (`/** */`) with a plain-English description of what the function does and why it exists. TypeScript types handle parameter and return documentation — do not add `@param` or `@returns` tags unless the type alone is ambiguous. Use the following tags when applicable:

- `@default` — document default values for options
- `@example` — include when usage is non-obvious
- `{@link OtherFunction}` — cross-reference related exports

```ts
/**
 * Custom storage implementation for Directus SDK on the server.
 * Prevents localStorage errors during SSR by using an in-memory Map.
 * @default used automatically when import.meta.server is true
 */
export function useDirectusStorage(): DirectusStorage { ... }
```

Inline code explanations use `//` comments. Only add one when the **why** is non-obvious — a hidden constraint, a subtle invariant, or a workaround for a specific upstream bug. Do not comment what the code does; well-named identifiers already do that.

### Quality Requirements

Before submitting a PR, confirm both pass:

```
pnpm lint
pnpm test
```

## Testing Code

Instructions for writing and amending tests can be found at @test/README.md

Files with `*.data.*` titles should only be loaded partially into context window unless they are being modified.
