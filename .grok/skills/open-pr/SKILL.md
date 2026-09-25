---
name: open-pr
description: >
  Open and optionally squash-merge a GitHub pull request for the current Pine
  branch with gh. Use when the user says open a PR, create a pull request,
  gh pr, open MR, merge my PR, or /open-pr. Also used as the PR/merge half of
  git-publish. Commit, changeset, and push stay in git-publish. A merge into
  dev is always a squash merge; the source branch is always deleted after merge.
when-to-use: >
  open a PR, create pull request, gh pr, open MR, /open-pr, merge my PR,
  squash merge
---

# Open a pull request

Repo operation. Stay in the parent session. Branch/changeset/commit/push: [git-publish](../git-publish/SKILL.md). Changeset rules: `changeset-release`.

This skill starts from a branch that already has its commits on `origin`. Integration branch is `dev` (never `development`).

| Mode           | When                                                                         | After create                                              |
| -------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Publish**    | Followed from `git-publish` publish mode, or user said `publish` / `ship it` | Squash-merge, delete source branch, switch to `dev`, pull |
| **Open only**  | User said only open/create a PR / MR                                         | Switch to `dev`, pull (leave PR open)                     |
| **Merge only** | User said merge on an existing PR                                            | Squash-merge, delete source branch, switch to `dev`, pull |

## Recipe

### 1. Confirm the branch can open a PR

```bash
git status -sb
git rev-parse --abbrev-ref HEAD
git status --porcelain
```

Stop when:

- Current branch is `main`, `dev`, or `release/*` (release flow: `changeset-release`)
- Working tree is dirty
- No upstream, or unpushed commits — finish push with `git-publish`, then continue

Merge-only: resolve the PR number with `gh pr view --json number,url,baseRefName,headRefName` (or the number the user gave) and skip create.

### 2. Create the pull request

| Source branch                | `--base`                    |
| ---------------------------- | --------------------------- |
| `feat/*`, `fix/*`, `chore/*` | `dev`                       |
| `hotfix/*`                   | `main`                      |
| `release/*`                  | do not open with this skill |

Title = conventional commit subject on the branch. Body = short behavior summary + test plan, via `--body-file` (scratch file under `$env:TEMP`, delete after):

```powershell
@"
## Summary
<behavior change>

## Test plan
- [ ] <check>
"@ | Set-Content -Path "$env:TEMP\pr.md" -Encoding utf8

gh pr create --base dev --title "<conventional subject>" --body-file "$env:TEMP\pr.md"
Remove-Item "$env:TEMP\pr.md"
```

Use `--base main` for `hotfix/*`. Return the PR URL. If the PR already exists, use that URL and continue.

When the user asked to skip the changeset check: `gh pr edit <number> --add-label skip-changeset`.

### 3. Merge (publish mode and merge-only)

Squash-merge and delete the source branch:

```powershell
gh pr merge <number> --squash --delete-branch
git switch dev
git pull
git branch -D <source-branch>
```

`--squash` is required when the base is `dev`. `--delete-branch` removes the remote branch. Delete the local source branch after checkout is on `dev`.

`hotfix/*` still targets `main`; squash and delete the same way. Sync `main` back to `dev` only when the user asks.

### 4. Open-only: return to dev

```bash
git switch dev
git pull
```

Local `dev` does not contain the PR until it is merged.

## Anti-patterns

- Opening a PR from `main`, `dev`, or `release/*` with this skill
- Switching branches over a dirty working tree
- Merging into `dev` without `--squash`
- Leaving remote or local source branch after a successful merge
- Waiting for a second merge confirmation when already in publish mode

## Done when

- **Publish / merge only:** squash-merged, source branches deleted, on up-to-date `dev`, PR URL reported
- **Open only:** PR URL reported, on up-to-date `dev`, PR still open
