# Pine agent rules

Canonical project instructions for coding agents (Grok, Claude Code, Cursor, Copilot, etc.).
Skills with deeper recipes live under `.grok/skills/*/SKILL.md`.

## Database migrations — do not generate

**Never generate, create, rewrite, or apply database migrations on your own.**

That includes, without an **explicit** user request in the current turn:

- Running `db:generate`, `dev:db:generate`, `drizzle-kit generate`, or any turbo/`pnpm` script that generates SQL migrations
- Running `db:migrate`, `db:push`, or equivalent apply/push commands
- Hand-writing or editing files under any service’s `drizzle/` folder (`.sql`, `meta/*_snapshot.json`, `_journal.json`, etc.)
- Inventing migration filenames, snapshots, or journal entries to “finish” a schema change

When schema/table code changes require a migration:

1. Update Drizzle table/schema TypeScript only (e.g. `src/db/tables/**`).
2. Stop and tell the user that a migration must be generated.
3. Give the exact command for the service (from that package’s `package.json`), for example:
   - `pnpm exec turbo run db:generate --filter=@pine/<service>`
   - or `pnpm --filter @pine/<service> db:generate`
4. Wait for the **user** to run generation (or to explicitly ask you to run it). Do not run it yourself unless they clearly request that in the same conversation.

Schema/type changes without touching `drizzle/` artifacts are fine. Shipping incomplete schema work and leaving migration generation to the human is the intended workflow.

## Branches, commits, and changesets

When finishing work that should land as a PR:

1. **Base off `dev`** (or the branch the user names). Create a **new branch** for the work; do not commit on `dev` / `main` unless asked.
2. **One logical commit** on that branch for the change set (prefer a single clean commit over a noisy trail of fixups).
3. **Add a Changeset** under `.changeset/` in the **same commit** when the change should bump a package or need release notes. CI allows **0 or 1** new changeset on non-draft PRs into `dev` (fail if more than one). `release/*` branches must have **zero**. Skip the check entirely with label `skip-changeset`.
4. **Commit message and Changeset summary must match** and stay **concise** (same short line in both places). When there is no changeset, the commit subject alone is enough.

Changeset file shape:

```markdown
---
"@pine/<package>": patch|minor|major
---

chore(scope): short summary matching the git commit subject
```

- Bump only packages whose published version should change. For non-deployables (docs, `.grok` skills, `.vscode`, tooling with no package bump), omit the changeset entirely (0 is allowed).
- Filename: short kebab-case slug, e.g. `.changeset/vscode-remove-json-comments.md`.
- Do **not** commit unrelated dirt (e.g. accidental `**/__generated__/**` or local env). Stage only files for this change.

Example flow:

```bash
git switch dev
git pull
git switch -c chore/vscode-remove-json-comments
# …edit…
# add .changeset/<slug>.md with summary == commit subject
git add <relevant paths> .changeset/<slug>.md
git commit -m "$(cat <<'EOF'
chore(vscode): remove comments from workspace JSON
EOF
)"
```

Saying **publish** runs `git-publish` end to end: new branch → changeset → commit → push → `open-pr` (create + squash-merge + back on `dev`).

## Other guardrails

- Prefer filtered turbo builds/tests; full monorepo only when needed.
- Never hand-edit `**/__generated__/**` or `api-gateway/dist/*`.
- Do not search or edit `infra/data/` or `node_modules/` for product work.
- Use current packages only: `@pine/server`, `@pine/events` — not `server-core` / `event-bus`.
- Load the matching skill under `.grok/skills/` (`orientation`, `service-feature`, `repository`, `drizzle`, `service`, `graphql`, `http-route`, `events`, `outbox`, `workers`, `authorization`, `identity-auth`, `testing`, `web-feature`, `schema-codegen`, `shared-packages`, `material-design-3`, `changeset-release`, `git-publish`, `open-pr`, `docker-infra`, `k8s`, `observability`, `dev-loop`). Skill folders have no `pine-` prefix.
- **Format with oxfmt before committing.** After editing TypeScript/JavaScript/JSON (and other oxfmt-supported files), run `pnpm exec oxfmt <paths you changed>` before commit or publish. Use `pnpm fmt` only for intentional repo-wide format PRs. Keep a full-repo reformat in its own chore commit.
- **No comments in code.** Do not add `//`, `/* */`, or JSDoc unless the user explicitly asks. Prefer clear names and structure over explanatory comments.
- **Standalone functions are arrows; class methods are not.** Module-level and other standalone functions use `const name = (…) => { … }` / `const name = async (…) => { … }` — never `function` declarations. Inside classes, use normal methods (`method(…) { … }` / `async method(…) { … }`), not arrow property methods. Constructors stay as `constructor`. Interfaces/types express callables as properties (`name: (arg: T) => R`), not method syntax.
- **Public members first.** In classes and modules, put the constructor and public methods/functions above private/protected helpers. Keep the public surface at the top of the type or file.
- **Never use `as` or `any`.** Ban TypeScript type assertions (`value as Foo`, `as const`, `as unknown as T`, etc.) and the `any` type (`: any`, `as any`, `<any>`, `Array<any>`, etc.). Fix types properly with generics, narrowing, unions, `unknown` + type guards, `satisfies`, or correct library typings. Do not silence type errors with casts.

## Naming — features, repositories, services, routes/resolvers

One **feature folder** is one **problem**. Name it after the resource (plural kebab-case: `workspaces`, `identities`) or the use-case (`signin`, `oauth`, `attachment-upload`). Keep `X` + `XRelation` (and similar) in that folder. Split only when the lifecycle or transport is a different problem (stored attachment vs upload pipeline; a foreign `identities` projection). Do not dump two aggregates into one feature, and do not create a feature per field.

**Drop the repeated noun** on repositories and services — the type already names the subject. **Keep the noun** where names share a flat namespace: GraphQL fields, HTTP `operationId`s, event types, error classes, table names.

| Layer                              | One                           | Many            | Create            | Update            | Delete            |
| ---------------------------------- | ----------------------------- | --------------- | ----------------- | ----------------- | ----------------- |
| `IWorkspaceRepository`             | `findById` (null if missing)  | `findMany`      | `save`            | `update`          | `softDelete`      |
| `IWorkspaceService`                | `getById` (throws if missing) | `list`          | `create`          | `update`          | `delete`          |
| GraphQL field / HTTP `operationId` | `getWorkspace`                | `getWorkspaces` | `createWorkspace` | `updateWorkspace` | `deleteWorkspace` |

Call sites read `workspaceService.create(...)`. The GraphQL field stays `createWorkspace`.

Same public identifier everywhere it is visible:

- GraphQL: filename = field (`queries/getWorkspace.ts` → `getWorkspace`)
- HTTP: filename = exported route = `operationId` (`verifyEmail.ts` → `export const verifyEmail` → `operationId: "verifyEmail"`)
- Client `.gql`: PascalCase of that identifier (`GetWorkspace`)

New GraphQL reads use `get*`, not `find*`. Qualifiers stay when needed (`getMyWorkspaces`, `getById` vs `list`). When the type is **not** the resource, keep the resource (`IAdminService.createIdentity`).

When editing a service that still uses the long form (`createIssue`, `getTenantById`), rename **that** service’s methods and its internal callers in the same change. Do not rename sibling services unless you are already in those files. Never rename GraphQL fields, HTTP `operationId`s, or event payloads as part of a service cleanup. Recipes: `.grok/skills/service-feature/SKILL.md` (slice), `repository`, `service`, `graphql`, `http-route`.

## Generated React Query hooks (web apps)

**Always use the generated hooks.** Never compose `useQuery` / `useMutation` with `*Options` helpers from codegen.

| Do                                                | Don't                                                |
| ------------------------------------------------- | ---------------------------------------------------- |
| `useVerifyEmailQuery({ query: { … } })`           | `useQuery({ ...verifyEmailOptions({ … }) })`         |
| `useGetConsentChallengeQuery({ query: { … } })`   | `useQuery({ ...getConsentChallengeOptions({ … }) })` |
| `useAcceptConsentChallengeMutation()`             | `useMutation(acceptConsentChallengeMutation())`      |
| GraphQL: `useFindProjectQuery(vars, { enabled })` | Hand-rolled `useQuery` against the GQL client        |

- REST/OpenAPI: import `useXQuery` / `useXMutation` from `@generated/api/@tanstack/react-query.gen`.
- GraphQL: import `useXQuery` / `useXMutation` from `@generated/gql`.
- `*Options` / `*Mutation` factories are for non-hook use only (prefetch, queryClient, tests) — not for components.
- Do not re-wrap generated options with TanStack's `useQuery` just to pass `enabled` or similar; use the generated hook API (and GraphQL's second-arg options object when available).
- **Never destructure** query/mutation hook results. Assign the return value and read properties (`const userQuery = useGetCurrentUserQuery(); userQuery.data`). Enforced by oxlint `pine/no-destructure-query-mutation`.
