---
name: orientation
description: >
  Map the Pine monorepo: owning app/service/package, live vs dead imports, where
  to edit. Use when locating ownership or asking where code lives.
when-to-use: >
  where does X live, monorepo map, which service, package layout, dead package,
  ownership
---

# Orientation

pnpm + Turborepo. Workspace: `apps/**`, `packages/**`, `services/**`. Related: `service-feature`, `dev-loop`, `shared-packages`.

## Where to edit

| Change | Location |
| ------ | -------- |
| UI | `apps/<web>` (`features/<domain>/`, `src/graphql/<domain>/`) |
| Business rules / API | owning `services/<service>/src/features/<problem>/` |
| Shared enum/DTO/error (2+ consumers) | `packages/common` (or other `@pine/*`) |
| Cross-service async | `@pine/events` → `events` |
| Transactional outbox / pollers | `@pine/outbox` → `outbox` / `workers` |
| Permission checks / Keto | `@pine/authorization` → `authorization` |
| Sign-in / session / OAuth | `identity-service` → `identity-auth` |
| Edge identity + GraphQL federation | `api-gateway` (`identity-auth`, `schema-codegen`) |
| HTTP server / GraphQL / logger | `@pine/server` |
| Shared `@pine/*` extract | `shared-packages` |
| Local stack | `infra/docker` + `pnpm dev:infra*` |
| Repo tooling | `tools/scripts/` |
| Agent skills | `.grok/skills/*/SKILL.md` |

Extract to `packages/*` only when **two** services need the same logic. Feature folders: `service-feature`.

## Ownership

| Domain | Owner |
| ------ | ----- |
| Auth / IdP / OAuth | `identity-service` + Ory (Kratos/Hydra) + `identity-web` |
| Platform / tenants / workspaces | `platform-service` + `platform-web` |
| Graph authorization (Keto) | `authorization-service` |
| Workspaces / projects / issues / statuses | `issues-service` + `pine-web` |
| Attachments | `attachment-service` |
| Transactional email / notifications | `notification-service` (`integrations/email`) |
| Federated GraphQL supergraph | `api-gateway` (`dist/supergraph.graphql`) — no feature fields here |
| REST proxy `/identity` `/attachments` `/authorization` | `api-gateway` |
| Client GraphQL ops | `apps/*/src/graphql/**/*.gql` (name = server field) |

**Apps:** `pine-web` (issues product UI), `identity-web` (sign-in/registration/consent), `platform-web` (platform admin).

**Services:** `identity-service`, `platform-service`, `authorization-service`, `issues-service`, `attachment-service`, `attachment-scanner-service`, `notification-service`, `api-gateway`, `data-gateway`.

| Package | Import for |
| ------- | ---------- |
| `@pine/common` | enums, DTOs, errors, `uuidv7` |
| `@pine/errors` | `ApplicationError` |
| `@pine/events` | NATS, CloudEvents, `publisher.send`, consumers |
| `@pine/server` | `FastifyHttpServer`, `PinoLogger`, Pothos `builder`, scalars |
| `@pine/security` | JWT, hashing, auth helpers |
| `@pine/observability` | OTEL bootstrap |
| `@pine/authorization` | Keto client, relations, `requirePermission` |
| `@pine/identity` | `requireIdentityId`, identity HTTP client |
| `@pine/outbox` | transactional outbox |
| `@pine/attachment` | attachment upload client |
| `@pine/ui` | shared MUI primitives |

## Dead packages

| Dead | Use |
| ---- | --- |
| `@pine/server-core` | `@pine/server` |
| `@pine/event-bus` | `@pine/events` |
| `@pine/graphql-core` | `@pine/server` (graphql-schema feature) |
| `@pine/orm` | Drizzle (`src/db/`, feature repositories) |
| `@pine/comm` | `notification-service/src/integrations/email` |
| `@pine/forms` | `@pine/ui` + app `shared/` / feature components |

Dockerfile turbo `--filter`s must use current names only.

## Anti-patterns

- Following root `README` install steps (monorepo `package.json` scripts are source of truth)
- Hand-editing `**/__generated__/**` or `api-gateway/dist/*`
- Searching `infra/data/` or `node_modules/` for product code
- Importing a dead package name

## Done when

- Owning app/service/package is named
- Imports use live package names only
