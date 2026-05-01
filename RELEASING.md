# Releasing

## Cutting a release

From `main`, with a clean working tree:

```bash
pnpm release
```

That runs lint + tests + build, then invokes `changelogen --release --push --no-github`, which:

1. Bumps `package.json` version based on conventional-commit history.
2. Writes `CHANGELOG.md`.
3. Commits both changes.
4. Tags the commit (e.g. `v5.1.0`).
5. Pushes the commit and tag to the current branch.

The pushed tag fires `.github/workflows/release.yml`, which re-runs CI (via `workflow_call` on `ci.yml`) and, if it passes, publishes to npm and creates the GitHub Release via `changelogithub`.

### Node versions

- **CI** runs on Node `lts/jod` (v22) — matches Nuxt's LTS floor, which is what end users run against.
- **Release** runs on Node `lts/krypton` (v24) — required for npm Trusted Publishing's OIDC handshake (needs npm 11, which ships with Node 24). CI passing on LTS gates whether release runs at all.

### Prereleases

From `next`, with a clean working tree:

```bash
pnpm release:next
```

Adds `--prerelease` to `changelogen` (producing tags like `v5.1.0-beta.0`) and the CI workflow publishes under the `next` npm dist-tag. The changelog on `next` stays on `next` — `main`'s changelog is not touched.

### Which branch owns what

- `main` is the source of truth for stable releases. `CHANGELOG.md` on `main` reflects stable history only.
- `next` cuts prereleases. Its `CHANGELOG.md` evolves independently and never writes back to `main`.
- When `next` work is ready to ship stable, merge `next` → `main` and run `pnpm release` from `main`. The stable changelog entry is generated from commits that landed on `main`.

### Authentication

Publishing uses **npm Trusted Publishing** (OIDC) — no `NPM_TOKEN` secret stored in the repo. The OIDC token is granted by the `id-token: write` permission in `release.yml`, and the npmjs.com package is configured with `rolleyio/nuxt-directus-sdk` + `release.yml` as a Trusted Publisher.

If the Trusted Publishing config on npmjs.com ever gets removed or the workflow filename changes, publish will fail with a 403. Re-add the repo as a Trusted Publisher on the package's Access page.

### Repo settings that matter

- Squash-merge only, with "default commit message = pull request title" — `changelogen` reads conventional commits from the PR title that lands on the release branch.
- Branch protection on `main` should allow tag creation; no direct pushes are needed for releases (the tag is pushed from your laptop by `pnpm release`).

## Troubleshooting

- **Tag already exists** — `changelogen` bumped but the push failed. Inspect with `git tag` and delete locally (`git tag -d vX.Y.Z`) if you need to retry. Avoid force-pushing tags that have already hit the remote.
- **Publish workflow ran but no npm release** — check the workflow run; `npm publish` can fail silently if provenance can't be signed. Requires Node 22.14+ and `id-token: write` permissions (both configured).
- **`ERR_PNPM_OUTDATED_LOCKFILE`** — the lockfile drifted from `package.json`. Run `pnpm install` locally, commit `pnpm-lock.yaml`, push.
