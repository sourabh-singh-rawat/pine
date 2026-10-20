---
name: repository
description: >
  Drizzle feature repositories: I*Repository, save/findById/findMany/softDelete,
  tx options, table columns. Use when adding or changing persistence.
when-to-use: >
  repository, IFooRepository, drizzle table, softDelete, findById, pgTable,
  auditColumns
---

# Repository

Persistence only. Canonical: `platform-service` `features/organizations/repositories`. Related: `service-feature`, `service`, `drizzle`, `outbox`.

## Layout

```text
services/<svc>/src/
  db/
    columns.ts
    tables/X.ts
    tables/index.ts
    schema.ts
    types.ts
  features/<feature>/repositories/
    IFooRepository.ts
    FooRepository.ts
    index.ts
```

`columns.ts`: `idColumn` + `auditColumns`. `tables/X.ts`: `pgTable` + relations + `$inferSelect`. `schema.ts` re-exports tables (+ `OutboxMessages` when used). `types.ts`: `Database`, `Transaction`, `DbClient`.

## Table

Export select/insert types from the table file. Re-export from `db/schema.ts` and `db/tables/index.ts`.

```ts
export const Organizations = pgTable(
  "organizations",
  {
    ...idColumn,
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => Tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    ...auditColumns,
  },
  (table) => [unique().on(table.tenantId, table.slug)],
);

export type Organization = typeof Organizations.$inferSelect;
export type NewOrganization = typeof Organizations.$inferInsert;
```

Table TS only. Migration generate/apply: `AGENTS.md`.

## Interface

Explicit persistence method names (e.g. `saveTenantMember`, `findTenantMemberById`, `listTenantMembersByTenantId`) are preferred. Concise forms (`save`, `findById`, `findMany`) are also permitted where clear.

| Method                                                | Meaning                                       |
| ----------------------------------------------------- | --------------------------------------------- |
| `saveFoo` / `save`                                    | insert                                        |
| `updateFoo` / `update`                                | patch; return row or `null`                   |
| `findFooById` / `findById` / `findByIds` / `findMany` | read; **null / empty**, never throw not-found |
| `existsBy…`                                           | boolean existence                             |
| `deleteFoo` / `softDelete` / `hardDelete`             | delete                                        |

```ts
export type TenantMemberRepositoryOptions = { tx?: DbClient };

export interface ITenantMemberRepository {
  saveTenantMember: (
    data: NewTenantMember,
    options?: TenantMemberRepositoryOptions,
  ) => Promise<TenantMember>;
  findTenantMemberById: (
    id: string,
    options?: TenantMemberRepositoryOptions,
  ) => Promise<TenantMember | null>;
  findTenantMemberByTenantAndIdentity: (
    tenantId: string,
    identityId: string,
    options?: TenantMemberRepositoryOptions,
  ) => Promise<TenantMember | null>;
  listTenantMembersByTenantId: (
    tenantId: string,
    options?: TenantMemberRepositoryOptions,
  ) => Promise<TenantMember[]>;
  updateTenantMemberRole: (
    id: string,
    role: string,
    options?: TenantMemberRepositoryOptions,
  ) => Promise<TenantMember>;
  deleteTenantMember: (id: string, options?: TenantMemberRepositoryOptions) => Promise<boolean>;
}
```

Qualify filters (`existsBySlugInTenant`, `findTenantMemberByTenantAndIdentity`).

## Recipe

- `@injectable()` class; inject `TYPES.Database`
- `private client(options?) { return options?.tx ?? this.db; }` for transactional writes
- `uuidv7()` for new ids; bump `version` on update/softDelete
- Filter soft-deleted rows with `isNull(table.deletedAt)` unless the method is about deleted rows
- No authz, events, or not-found errors — `service`

```ts
@injectable()
export class OrganizationRepository implements IOrganizationRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: CreateOrganizationEntity,
    options?: OrganizationRepositoryOptions,
  ): Promise<Organization> {
    const client = this.client(options);
    const [created] = await client
      .insert(Organizations)
      .values({
        id: uuidv7(),
        tenantId: entity.tenantId,
        name: entity.name,
        slug: entity.slug,
        createdAt: new Date(),
        version: 1,
      })
      .returning();
    return created;
  }

  private client(options?: OrganizationRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
```

```ts
TYPES.OrganizationRepository = Symbol.for("IOrganizationRepository");
container.bind<IOrganizationRepository>(TYPES.OrganizationRepository).to(OrganizationRepository);
```

Export interface + impl from the repositories barrel.

## Anti-patterns

- Throwing not-found from the repository
- `create` / `getById` as repository method names
- Authz or CloudEvent publish here
- Hand-writing or auto-running migrations

## Done when

- Table exported from `schema.ts` when persistence changes
- `I*Repository` + impl + TYPES + bind
- Reads return null/empty; migrations not generated by the agent
