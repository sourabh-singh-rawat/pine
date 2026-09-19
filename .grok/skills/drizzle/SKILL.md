---
name: drizzle
description: >
  Shared Drizzle schema layout across services: columns, schema re-exports,
  drizzle.config, OutboxMessages. Use when adding a table, wiring schema.ts,
  or needing the migration generate command.
when-to-use: >
  drizzle.config, db/schema.ts, idColumn, auditColumns, OutboxMessages,
  db:generate, pgTable
---

# Drizzle

Service-local Drizzle. Canonical: `platform-service` `src/db/`. Table/repository methods: `repository`. Outbox table: `outbox`. Migrations: `AGENTS.md` (do not generate or apply unless the user asks).

## Layout

```text
services/<svc>/
  drizzle.config.ts
  drizzle/                 # generated only — do not hand-edit
  src/db/
    columns.ts
    tables/X.ts
    tables/index.ts
    schema.ts
    types.ts
    index.ts
```

`drizzle.config.ts` loads the **root** `.env` and points at `./src/db/schema.ts` + `process.env.<DOMAIN>_DATABASE_URL`.

```ts
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.PLATFORM_DATABASE_URL,
  },
});
```

`columns.ts`: `idColumn` (`uuid` PK) + `auditColumns` (`createdAt`, `updatedAt`, `deletedAt`, `version`). Domain tables spread both.

`schema.ts` re-exports every table the ORM must see, including `OutboxMessages` from `@pine/outbox` when the service publishes via outbox. `types.ts`: `Database = NodePgDatabase<typeof schema>`, `Transaction`, `DbClient = Database | Transaction`.

## Recipe

1. Add `src/db/tables/X.ts` (`repository` table sample)
2. Re-export from `tables/index.ts` and `schema.ts`
3. Stop. Tell the user to generate:

```bash
pnpm exec turbo run db:generate --filter=@pine/<service>
```

or `pnpm --filter @pine/<service> db:generate`. Do not run it, `db:migrate`, or `db:push` unless they explicitly ask in this conversation.

Seed scripts stay service-local (`src/db/seed.ts` where they exist). Env URLs: `docker-infra`.

## Anti-patterns

- Hand-writing `drizzle/*.sql` or `meta/*_snapshot.json`
- A second `schema.ts` / `columns.ts` convention in one service
- Copy-pasting `outbox_messages` instead of `export { OutboxMessages } from "@pine/outbox"`
- Per-package `.env` for `dbCredentials`
- Generating migrations unprompted

## Done when

- Table is exported from `schema.ts`
- Config still uses root env + `./src/db/schema.ts`
- Generate command given to the user; `drizzle/` untouched by the agent
