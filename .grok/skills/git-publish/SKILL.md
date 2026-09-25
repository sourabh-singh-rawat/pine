---
name: git-publish
description: >
  Publish Pine work end to end: create a branch, add a changeset only for
  deployable package bumps, commit, push, open a GitHub PR, squash-merge it,
  delete the source branch, and return to dev. Use when the user says publish,
  ship it, git-publish, or /git-publish. "commit" or "push" alone stop after
  push. PR create/merge mechanics live in open-pr; changeset file shape lives
  in changeset-release.
when-to-use: >
  publish, ship it, git-publish, /git-publish, commit, push, stage and commit
---

# Git publish

Repo operation. Stay in the parent session. Related: `open-pr`, `changeset-release`. Policy: `AGENTS.md`.

Integration branch is `dev`. Protected: `main`, `dev`, `release/*`.

| Mode                  | Triggers                                            | Runs through                                                                         |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Publish** (default) | `publish`, `ship it`, `git-publish`, `/git-publish` | branch → changeset (deployables only) → commit → push → PR → squash-merge → on `dev` |
| **Commit/push only**  | user says only `commit` and/or `push`               | branch (if needed) → changeset (deployables only) → commit → push                    |

| Concern                                      | Rule                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| Protected branches                           | Never commit directly on `main`, `dev`, `release/*`                          |
| Feature / chore / fix                        | `feat/*`, `chore/*`, `fix/*` from `dev`                                      |
| Hotfix                                       | `hotfix/*` from `main`; sync `main` → `dev` only when asked                  |
| Commits                                      | Conventional; one logical commit per change set                              |
| Changeset                                    | Deployable package bumps only; same commit; **0 or 1** (`changeset-release`) |
| Secrets                                      | Block on credential patterns                                                 |
| Force push / `--no-verify` / `--no-gpg-sign` | Never without explicit confirmation                                          |

## Recipe

### 1. Verify and review

```bash
git rev-parse --is-inside-work-tree
git branch --show-current
git status --short
git branch -vv
```

Stop on: not a repo, detached HEAD, merge conflicts, or unrelated concerns mixed in one change set.

### 2. Create a branch

If on `main` / `dev` / `release/*`:

```bash
git fetch origin
git switch dev
git pull
git switch -c feat/scope-verb-description
```

| On     | Work                  | Create     |
| ------ | --------------------- | ---------- |
| `dev`  | feature               | `feat/…`   |
| `dev`  | bug fix               | `fix/…`    |
| `dev`  | chore / docs / skills | `chore/…`  |
| `main` | production emergency  | `hotfix/…` |

Already on a feature branch with only this work: keep it.

### 3. Changeset

Add a changeset **only** when a published `@pine/*` package version should change (`changeset-release`, `AGENTS.md`). At most one file, same commit; summary line equals the commit subject.

Omit the changeset for non-deployables (`.grok` skills, docs, `.vscode`, CI/tooling with no package bump). CI allows **0** changesets. Do not add empty-frontmatter changesets. Use label `skip-changeset` only when the user explicitly asks to bypass the check.

### 4. Stage and inspect

```bash
git add <paths>
# when deployable:
git add .changeset/<slug>.md
git diff --cached --stat
git diff --cached
```

Prefer explicit paths. Do not stage `**/__generated__/**`, local env, or unrelated dirt.

### 5. Scan secrets and lockfiles

```bash
git diff --cached | grep -iE "(password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key|-----BEGIN)"
command -v gitleaks >/dev/null && gitleaks protect --staged --no-banner
git diff --cached --name-only | grep -E "(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)"
```

Stop on secret matches. Confirm unexpected lockfile changes. Public frontend prefixes (`VITE_*`, `NEXT_PUBLIC_*`) are fine when non-sensitive.

### 6. Commit

User-supplied message wins. Otherwise derive from the staged diff: `type(scope): description` (lowercase, present tense).

| Type                      | When                     |
| ------------------------- | ------------------------ |
| `feat`                    | new functionality        |
| `fix`                     | bug fix                  |
| `refactor`                | internal improvement     |
| `perf`                    | measurable performance   |
| `build` / `ci`            | tooling / CI             |
| `docs` / `test` / `chore` | docs, tests, maintenance |

```bash
git commit -m "$(cat <<'EOF'
type(scope): short summary
EOF
)"
```

On Windows PowerShell, write the message to `$env:TEMP\commit-msg.txt`, run `git commit -F` that path, then delete the file.

### 7. Push

```bash
git push --set-upstream origin HEAD
```

On non-fast-forward: fetch, show divergence, ask rebase vs merge. Never auto-rebase, auto-merge, or force-push.

**Commit/push-only mode stops here.**

### 8. PR + merge (publish mode)

Follow [open-pr](../open-pr/SKILL.md) in **publish** mode: create the PR, squash-merge it, delete the source branch, switch to `dev`, and pull. Saying `publish` authorizes that merge in the same turn.

## Anti-patterns

- Committing on `main`, `dev`, or `release/*`
- Stopping after push when the user said `publish`
- Asking again whether to merge during a publish turn
- More than one changeset on the branch
- Force-push / hook bypass / signing bypass without explicit confirmation

## Done when

**Publish:** change is squash-merged into `dev`, source branch deleted, local checkout on up-to-date `dev`, PR URL reported.

**Commit/push only:** commits on a non-protected branch with upstream set; working tree clean for this change set.
