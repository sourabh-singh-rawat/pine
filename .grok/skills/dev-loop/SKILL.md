---
name: dev-loop
description: >
  Run Pine locally: infra, apps, filtered turbo build/test/lint, schema compose.
  Use when starting the stack, verifying a package, or asking how to run a command.
when-to-use: >
  pnpm dev, turbo filter, schemas:compose, how do I run, build affected,
  setup:skip-docker
---

# Dev loop

Root cwd. Node ≥20.13.1; pnpm from root `packageManager`. Related: `docker-infra`, `observability`, `schema-codegen`, `testing`.

## Recipe

```bash
pnpm dev:infra
pnpm setup
pnpm setup:skip-docker
pnpm schemas:compose
pnpm dev:apps
```

`pnpm setup` / `pnpm setup:restart` → `tools/scripts/setup/setup.ts --restart` (compose down, wipe `infra/data`, compose up). `setup:skip-docker` skips docker. Seed needs infra + `BOOTSTRAP_ADMIN_*` in root `.env`. Down: `pnpm dev:infra:down`.

| Infra variant | Script |
| ------------- | ------ |
| Default single-db + Ory | `dev:infra` |
| Multi-db | `dev:infra:multi-db` |
| + OTEL stack | `dev:infra:observability` |
| Kratos / Hydra only | `dev:infra:kratos` / `dev:infra:hydra` |

Compose overlays and ports: `docker-infra`. Env: single root `.env` (from `.env.example`).

```bash
pnpm exec turbo run dev --filter=@pine/items-service
pnpm exec turbo run build test --filter=@pine/<name>...
```

`...` includes dependents. Shortcuts: `pnpm pine-web`, `identity-service`, `items-service`, `api-gateway`, …

| Touched | Command |
| ------- | ------- |
| Package/service | `turbo run build test --filter=@pine/<name>...` |
| GraphQL schema | service `dist/schema.graphql` → `schemas:compose` → web `gen` |
| Shared lib | `build:server` or affected filters |
| Style | `pnpm lint` / `fmt:check` |

Also: `pnpm build`, `build:server`, `build:affected`, `test`, `test:affected`, `check:knip`. Supergraph: `services/api-gateway/dist/supergraph.graphql`. Pre-commit runs `pnpm build`.

## Anti-patterns

- Full-monorepo turbo when a `--filter` would do
- Hand-editing `__generated__/`
- Searching `infra/data/` or `node_modules/`
- Generating/applying DB migrations unless the user asked (`AGENTS.md`)
- Leaving root `Dockerfile` turbo filters on dead package names after a rename

## Done when

- The user has the exact filtered command for the package they care about
- Infra/env matches `docker-infra` / root `.env.example`
