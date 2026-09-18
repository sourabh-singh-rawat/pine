---
name: service-feature
description: >
  Wire a backend feature slice: one problem folder, DI TYPES, repository +
  service + GraphQL or HTTP. Use when scaffolding a domain folder or binding
  the container.
when-to-use: >
  new feature, feature folder, DI TYPES, container.bind, scaffold domain module
---

# Service feature

Wire layers; do not re-implement them. Canonical GraphQL: `platform-service` `features/workspaces`. Canonical HTTP: `authorization-service` `features/authorization`. Related: `repository`, `drizzle`, `service`, `graphql`, `http-route`, `events`, `outbox`, `workers`, `authorization`, `testing`.

| Layer | Skill |
| ----- | ----- |
| Repository / Drizzle tables | `repository` / `drizzle` |
| Application service | `service` |
| Authz checks / relation events | `authorization` |
| GraphQL fields | `graphql` |
| HTTP routes | `http-route` |
| NATS publish / consumers | `events` |
| Outbox schedule + pollers | `outbox` |
| Background process kind | `workers` |
| Colocated tests | `testing` |

Verbs and rename rules: `AGENTS.md`.

## Layout

```text
services/<svc>/src/
  features/<feature>/{services,graphql|routes,schemas,repositories,consumers,errors}/
  db/tables/
  integrations/
  bootstrap/{container-types,container,db,broker,logger}.ts
  main.ts
```

## Feature folders

| Kind | Folder | Examples |
| ---- | ------ | -------- |
| Entity aggregate | plural kebab-case | `workspaces`, `identities`, `tenants` |
| Use-case / protocol | the problem | `signin`, `oauth`, `verification`, `attachment-upload` |
| Foreign projection | source entity name | `identities` / `tenants` in a consuming service |

Keep aggregate + relations + transport + repos + services + errors together. Split only when the lifecycle differs (`attachment` vs `attachment-upload`). Legacy singular folders stay until a dedicated rename.

## Recipe

1. Table (if needed) → `repository`
2. `IFooRepository` + impl + TYPES + bind → `repository`
3. `IFooService` + impl + TYPES + bind → `service`
4. Transport in the **same** feature: GraphQL → `graphql`; HTTP → `http-route`
5. Async → `events` (publish/outbox; consumers under `consumers/`)
6. Colocated `*.test.ts` for non-trivial service logic → `testing`

```ts
TYPES.WorkspaceRepository = Symbol.for("IWorkspaceRepository");
TYPES.WorkspaceService = Symbol.for("IWorkspaceService");
container.bind<IWorkspaceRepository>(TYPES.WorkspaceRepository).to(WorkspaceRepository);
container.bind<IWorkspaceService>(TYPES.WorkspaceService).to(WorkspaceService);
```

## Imports

| Need | From |
| ---- | ---- |
| Server / routes / logger | `@pine/server` |
| Bus | `@pine/events` |
| Persistence | Drizzle `src/db/` + feature repositories |
| Authz | `@pine/authorization` |
| Outbox | `@pine/outbox` |
| Enums / errors | `@pine/common`, `@pine/errors` |

Live vs dead package names: `orientation`.

## Service-specific

**Identity HTTP:** IdP behind `IIdentityProvider` / `IOAuthProvider` in `integrations/` — routes via `http-route`.

**Notification email:** `integrations/email/{IMailer,NodeMailer}`; `TYPES.Mailer`; `bootstrap/mailer.ts`.

## Anti-patterns

- Domain rules in the repository or resolver
- Two aggregates in one folder, or a feature per field
- Renaming GraphQL fields / HTTP `operationId`s during a service method cleanup
- Auto-generating Drizzle migrations

## Done when

- Feature folder matches one problem
- Layer skills satisfied; TYPES + bind + barrels wired
- `pnpm exec turbo run build --filter=@pine/<service>` green
