---
name: shared-packages
description: >
  When to extract @pine/* vs keep logic service-local. Use when sharing types,
  clients, or helpers across services or considering a new package.
when-to-use: >
  extract package, @pine/common, shared package, new workspace package,
  two consumers
---

# Shared packages

Extract only when **two** services (or a service + an app) need the same module. Canonical names: `orientation`. Related: `service-feature`, `orientation`.

## Recipe

| Put in `@pine/*`                                                                    | Keep in the service                                               |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Enums/DTOs/errors used by 2+ consumers (`@pine/common`, `@pine/errors`)             | Feature services, tables, GraphQL/HTTP                            |
| Cross-service clients (`@pine/identity`, `@pine/authorization`, `@pine/attachment`) | Kratos/Hydra/Keto SDKs (wrap behind `integrations/` `I*Provider`) |
| Bus + outbox runtime (`@pine/events`, `@pine/outbox`)                               | Durable consumer classes, schedule call sites                     |
| HTTP/GraphQL server kit (`@pine/server`)                                            | Feature routes/resolvers                                          |
| OTEL bootstrap (`@pine/observability`)                                              | Per-service `initializeObservability({ serviceName })`            |
| UI primitives (`@pine/ui`)                                                          | App feature screens                                               |

New package: `packages/<name>` with `@pine/<name>`, consumed via `workspace:^`. Do not add `packages/` for a single service. Prefer `@pine/common` for a small shared enum over a one-file package.

Dead names (`server-core`, `event-bus`, `orm`, `comm`, `forms`, `graphql-core`): `orientation`. Dockerfile turbo `--filter`s must use live names.

## Anti-patterns

- A new `@pine/*` with one consumer
- Importing Ory/Keto/NATS clients from `packages/common`
- Moving a feature service into a package “for reuse”
- Reintroducing a dead package name

## Done when

- Shared module has ≥2 real consumers or lives next to its only consumer
- Imports use live `@pine/*` names from `orientation`
