# Agent skills

Discovered from `.grok/skills/`. Folder name = `name` frontmatter. No `pine-` prefix.

Global guardrails (migrations, changesets, naming, no `as`/`any`, arrows vs class methods): root [`AGENTS.md`](../../AGENTS.md). Dead packages: [orientation](./orientation/SKILL.md).

## Backend layers

| Skill | Load when |
| ----- | --------- |
| [service-feature](./service-feature/SKILL.md) | New feature folder / DI / wire the slice |
| [repository](./repository/SKILL.md) | Drizzle table + `I*Repository` |
| [drizzle](./drizzle/SKILL.md) | `schema.ts`, `drizzle.config`, `db:generate` |
| [service](./service/SKILL.md) | `I*Service`, authz, tx, outbox |
| [graphql](./graphql/SKILL.md) | Pothos fields / compose |
| [http-route](./http-route/SKILL.md) | `HttpRoute` / `operationId` / OpenAPI |
| [events](./events/SKILL.md) | NATS publish / consumers |
| [outbox](./outbox/SKILL.md) | `schedule` + `OutboxWorker` |
| [workers](./workers/SKILL.md) | Background process kind (outbox / NATS / scanner / BullMQ) |
| [authorization](./authorization/SKILL.md) | `requirePermission`, Keto, relation events |
| [identity-auth](./identity-auth/SKILL.md) | Kratos/Hydra, session, OAuth |
| [testing](./testing/SKILL.md) | Vitest, constructor doubles |

## Apps & platform

| Skill | Load when |
| ----- | --------- |
| [orientation](./orientation/SKILL.md) | Where does X live / ownership |
| [dev-loop](./dev-loop/SKILL.md) | Run, build, test, compose |
| [web-feature](./web-feature/SKILL.md) | React routes / `.gql` / codegen |
| [schema-codegen](./schema-codegen/SKILL.md) | `schemas:compose`, `gen:gql`, `gen:api` |
| [shared-packages](./shared-packages/SKILL.md) | Extract `@pine/*` vs service-local |
| [material-design-3](./material-design-3/SKILL.md) | M3 Expressive UI / theme / MUI |
| [changeset-release](./changeset-release/SKILL.md) | Changeset / calver release |
| [docker-infra](./docker-infra/SKILL.md) | Local compose / Ory |
| [k8s](./k8s/SKILL.md) | Helm / cluster |
| [observability](./observability/SKILL.md) | OTEL / Alloy |

## Skill shape

Every `SKILL.md` is an agent recipe. Same skeleton:

```markdown
---
name: example-skill
description: >
  What it does. Use when <concrete situation>.
when-to-use: >
  phrase one, phrase two, identifier
---

# Title

One-line role. Canonical: `path`. Related: `other-skill`.

## Layout          # omit if no files
## Recipe          # or a named domain section that *is* the recipe
## Anti-patterns
## Done when
```

| Own here | Point elsewhere |
| -------- | --------------- |
| Layer verbs, file layout, copy-paste samples | `AGENTS.md` for migrations, naming policy, changesets, style |
| Dead package table | `orientation` only |
| Long token/mapping tables | `references/` (see M3) |

Do not add a second closing section (`Rules`, `Hard rules`, `Guardrails`, `Traps`, `Do / Don't`, `Package pitfalls`). Put dos in **Recipe**, don’ts in **Anti-patterns**. Samples have no `//` comments. Canonical examples come from the live tree (`platform-service` `workspaces`), not legacy-only happy paths.

`description` + `when-to-use` use concrete nouns (`getWorkspace`, `HttpRoute`, `pnpm changeset`). Avoid ultra-generic triggers alone (`query`, `mutation`, `build`, `test`).
