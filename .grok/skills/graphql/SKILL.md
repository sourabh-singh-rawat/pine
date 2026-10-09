---
name: graphql
description: >
  Pothos GraphQL via @pine/server: inputs, objects, resolvers, schema compose.
  Use when adding or changing a GraphQL field or federated compose step.
when-to-use: >
  Pothos, CreateOrganizationInput, builder.mutationFields, getOrganization,
  schemas:compose, supergraph
---

# GraphQL

Pothos `builder` from `@pine/server` (scalars: `DateTimeISO`, `UUID`, `EmailAddress`). Canonical: `platform-service` `features/organizations`. Related: `service`, `service-feature`, `web-feature`, `http-route`, `schema-codegen`.

Service emits `dist/schema.graphql`. Compose: `pnpm schemas:compose` → `services/api-gateway/dist/supergraph.graphql`. Clients: `web-feature`.

## Layout

```text
features/<domain>/graphql/
  index.ts
  inputs/CreateXInput.ts
  objects/XObject.ts
  queries/getX.ts
  mutations/createX.ts
```

`index.ts` is side-effect imports only. `src/graphql/schema.ts` must import the feature barrel or the field is absent. GraphQL lives in the feature that owns the problem.

## Naming

Field name = filename. Keep the resource. New reads use `get*`, not `find*`.

| Thing                     | Style                                    | Example                   |
| ------------------------- | ---------------------------------------- | ------------------------- |
| Query (one)               | `get{Resource}`                          | `getOrganization`            |
| Query (many)              | `get{Resources}`                         | `getOrganizations`           |
| Query (caller)            | `getMy{Resources}`                       | `getMyOrganizations`         |
| Mutation                  | `create` / `update` / `delete{Resource}` | `createOrganization`         |
| GraphQL type / input file | PascalCase                               | `CreateOrganizationInput.ts` |
| Query / mutation module   | camelCase, one field per file            | `getOrganization.ts`         |

| Field             | Service                          |
| ----------------- | -------------------------------- |
| `createOrganization` | `organizationService.create(...)`   |
| `getOrganization`    | `organizationService.getById(...)`  |
| `getOrganizations`   | `organizationService.list(...)`     |
| `getMyOrganizations` | `organizationService.listMine(...)` |
| `updateOrganization` | `organizationService.update(...)`   |
| `deleteOrganization` | `organizationService.delete(...)`   |

Existing `findIssue` / `findProjects` / `findIdentities` stay until a dedicated schema rename. Do not mix `get` and `find` on the same resource.

## Recipe

```ts
export const CreateOrganizationInput = builder.inputType("CreateOrganizationInput", {
  fields: (t) => ({
    tenantId: t.string({ required: true }),
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
  }),
});
```

```ts
builder.mutationFields((t) => ({
  createOrganization: t.field({
    type: OrganizationObject,
    args: { input: t.arg({ type: CreateOrganizationInput, required: true }) },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IOrganizationService>(TYPES.OrganizationService);
      return service.create(
        {
          tenantId: input.tenantId,
          name: input.name,
          slug: input.slug,
        },
        requireIdentityId(ctx),
      );
    },
  }),
}));
```

Queries: `builder.queryFields`. Identity: `createContext` copies `request.identity` (from `resolveIdentityFromHeaders`) onto `ctx`; use `requireIdentityId(ctx)`. Do not invent a second auth context. Tx and events belong in `service`. `api-gateway` federates subgraphs — it does not declare feature fields.

```bash
pnpm schemas:compose
pnpm --filter @pine/pine-web gen:gql
```

Same `gen:gql` on `platform-web` / `identity-web` when those apps consume the field.

## Anti-patterns

- Domain logic or transactions in the resolver
- Parallel client name (`FindOrganization` over field `getOrganization`)
- Mixing `get*` and `find*` on the same resource in one change
- Skipping the feature `graphql/index.ts` import
- Hand-editing `api-gateway/dist` or `__generated__`

## Done when

- Field file name = GraphQL field name
- Resolver is a thin service call; feature barrel imported from `schema.ts`
- `schemas:compose` (and client `gen:gql` if UI consumes it) run when needed
