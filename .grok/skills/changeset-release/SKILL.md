---
name: changeset-release
description: >
  Changesets for development PRs; calver release/* branches and GitHub Release on
  main. Use when adding a changeset, opening a release branch, or shipping calver.
when-to-use: >
  changeset, skip-changeset, release/YYYY, calver, pnpm changeset,
  changeset:version
---

# Changesets & release

PR/commit policy: `AGENTS.md`. This skill is the file shape and release flow.

| Concept        | Value                                         |
| -------------- | --------------------------------------------- |
| PR notes       | `.changeset/*.md` via `pnpm changeset`        |
| Product tag    | `vYYYY.MM.DD.N`                               |
| Release branch | `release/YYYY.MM.DD.N`                        |
| Config         | `.changeset/config.json` (`baseBranch: main`) |

Scripts: `tools/scripts/branches/create-release-branch.ts`, `clean-local-branches.ts`; `tools/scripts/release/changeset-required.ts`, `release-branch-check.ts`, `release.ts`; `tools/scripts/changelog/main.ts`.

## Recipe — PR → `dev`

Non-draft PRs: **0 or 1** new changeset (`changeset-required.yml`). Base: `origin/dev`. `release/*`: **zero**. Escape: label `skip-changeset`. Drafts skip until ready. Non-deployables (docs, skills, tooling): omit changeset (0 is fine). Full ship (`publish`): `git-publish` (changeset only for package bumps; then `open-pr` squash-merge).

```bash
pnpm changeset
pnpm changeset-required
```

```md
---
"@pine/pine-web": minor
---

feat(pine-web): one-line summary
```

Summary line = git commit subject.

## Recipe — product release

1. From `dev`: `pnpm branch:release --push` → `release/YYYY.MM.DD.N`
2. CI (`release-version.yml`): pending changesets → `pnpm changeset:version` (`changeset version` + `pnpm changelog:root`); else if `CHANGELOG.md` lacks `## vYYYY.MM.DD.N` → `pnpm changelog:root` only. Commits `chore(release): vYYYY.MM.DD.N` and pushes.
3. PR `release/YYYY.MM.DD.N` → `main` (`release-branch-check.yml`: calver name, zero leftover changesets)
4. Merge to `main` → annotated tag `vYYYY.MM.DD.N` + GitHub Release from the matching `CHANGELOG.md` section
5. Sync `main` back to `dev`. Optional: `pnpm branch:clean`

Local version bump if needed:

```bash
pnpm changeset:version
git add -A
git commit -m "chore(release): vYYYY.MM.DD.N"
git push
```

Ops backfill: `pnpm release --sync-notes`. Package helpers: `pnpm changeset` · `changeset:version` · `changeset:release` (package semver; product ship is calver).

## Anti-patterns

- More than one new changeset on a non-draft PR into `dev`
- Summary that does not match the commit subject
- New changesets on `release/*`
- Non-calver product tags (`release-2026...`, hand-tagged semver)

## Done when

- 0 or 1 new changeset (or `skip-changeset`) for a `dev` PR; summary matches commit
- Release branches are `release/YYYY.MM.DD.N` with zero leftover changesets
