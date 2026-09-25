---
name: graphql
description: >
  Pothos GraphQL via @pine/server: inputs, objects, resolvers, schema compose.
  Use when adding or changing a GraphQL field or federated compose step.
when-to-use: >
  Pothos, CreateWorkspaceInput, builder.mutationFields, getWorkspace,
  schemas:compose, supergraph
---

# GraphQL

Pothos `builder` from `@pine/server` (scalars: `DateTimeISO`, `UUID`, `EmailAddress`). Canonical: `platform-service` `features/workspaces`. Related: `service`, `service-feature`, `web-feature`, `http-route`, `schema-codegen`.

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
| Query (one)               | `get{Resource}`                          | `getWorkspace`            |
| Query (many)              | `get{Resources}`                         | `getWorkspaces`           |
| Query (caller)            | `getMy{Resources}`                       | `getMyWorkspaces`         |
| Mutation                  | `create` / `update` / `delete{Resource}` | `createWorkspace`         |
| GraphQL type / input file | PascalCase                               | `CreateWorkspaceInput.ts` |
| Query / mutation module   | camelCase, one field per file            | `getWorkspace.ts`         |

| Field             | Service                          |
| ----------------- | -------------------------------- |
| `createWorkspace` | `workspaceService.create(...)`   |
| `getWorkspace`    | `workspaceService.getById(...)`  |
| `getWorkspaces`   | `workspaceService.list(...)`     |
| `getMyWorkspaces` | `workspaceService.listMine(...)` |
| `updateWorkspace` | `workspaceService.update(...)`   |
| `deleteWorkspace` | `workspaceService.delete(...)`   |

Existing `findIssue` / `findProjects` / `findIdentities` stay until a dedicated schema rename. Do not mix `get` and `find` on the same resource.

## Recipe

```ts
export const CreateWorkspaceInput = builder.inputType("CreateWorkspaceInput", {
  fields: (t) => ({
    tenantId: t.string({ required: true }),
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
  }),
});
```

```ts
builder.mutationFields((t) => ({
  createWorkspace: t.field({
    type: WorkspaceObject,
    args: { input: t.arg({ type: CreateWorkspaceInput, required: true }) },
    resolve: async (_root, { input }, ctx) => {
      const service = container.get<IWorkspaceService>(TYPES.WorkspaceService);
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
- Parallel client name (`FindWorkspace` over field `getWorkspace`)
- Mixing `get*` and `find*` on the same resource in one change
- Skipping the feature `graphql/index.ts` import
- Hand-editing `api-gateway/dist` or `__generated__`

## Done when

- Field file name = GraphQL field name
- Resolver is a thin service call; feature barrel imported from `schema.ts`
- `schemas:compose` (and client `gen:gql` if UI consumes it) run when needed
