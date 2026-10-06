# Releasing

Releases are automated with [uppt](https://github.com/danielroe/uppt), the same flow used by nuxt/nuxt and nuxt/image. Nobody releases from a laptop and no npm tokens exist.

## The release cycle

1. **Merge PRs into `main`.** Every squash commit's title is a conventional commit; that is what drives version bumps and changelog entries. Every PR also gets an installable preview package via pkg.pr.new for testing before merge.
2. **A draft release PR appears automatically.** On every push to `main`, `uppt/pr` parses commits since the last tag, picks the bump (a `fix:` opens `release/v6.1.4`, a later `feat:` supersedes it with `release/v6.2.0`), and opens or updates a release PR containing only the `package.json` version bump. Its body is the generated changelog.
3. **Curate the release PR.** Edit the body freely: anything above the `## 👉 Changelog` heading is preserved when the changelog regenerates, so put highlights, timetables, or TODO checklists there. The body becomes the GitHub release notes verbatim.
4. **Merge the release PR to cut the release.** `uppt/release` tags the squash commit, creates the GitHub release from the PR body, and dispatches the publish jobs on the tag.
5. **Approve the staged publish.** `uppt/pack` builds the tarball (see build notes below) and `uppt/publish` stages it on npm via OIDC trusted publishing. Approve it on npmjs.com (requires 2FA) and the version goes live.

The changelog lives in GitHub Releases from v6.1.3 onward; `CHANGELOG.md` is frozen.

## Build notes

`prepack` (`nuxt-module-build build`) extends `playground/.nuxt/tsconfig.json`, so the playground must be prepared before packing. The `pack` job therefore handles checkout and install itself (`checkout: false`, `install: false` on `uppt/pack`) and runs `pnpm run dev:prepare` before the pack step. The pkg.pr.new workflow does the same.

## Prereleases

uppt has no prerelease channel yet. When the next major needs betas, cut them manually from the major branch (e.g. `v7`): bump the version to `7.0.0-beta.N`, tag it, build with `pnpm run dev:prepare && pnpm run prepack`, and `npm publish --tag next` with a 2FA login. Revisit if uppt grows prerelease support.

## One-off configuration this flow depends on

- **npm trusted publisher** on the package's Access page: repo `rolleyio/nuxt-directus-sdk`, workflow `release.yml`, environment `npm`, with the `npm stage publish` permission. Staged publishing means every release needs a manual approval on npmjs.com before it goes live.
- **GitHub environment `npm`**, matching the trusted publisher entry (scoped to `v*` tags).
- **Allow GitHub Actions to create and approve pull requests** under Settings, Actions, General. Without it, `uppt/pr` fails with 403 when opening the release PR.
- **Squash merge with PR title as the commit message**, so conventional PR titles land on `main`.

## Troubleshooting

- **Publish failed or was never staged.** Re-run the publish path manually: Actions, Release, Run workflow, pick the `vX.Y.Z` tag. `pack` and `publish` are idempotent from a tag.
- **`uppt/pr` 403 when opening the release PR.** The "allow Actions to create pull requests" setting was turned off; re-enable it.
- **Trusted publishing 403 on publish.** The trusted publisher entry on npmjs.com was removed or the workflow filename or environment name changed. Re-add it on the package's Access page.
- **Wrong version in the release PR.** Check the commit titles on `main` since the last tag; the bump is derived from them. Fix by landing a correctly-typed commit; the PR updates on the next push.
