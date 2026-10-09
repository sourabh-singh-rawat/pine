---
name: schema-files
description: >
  One TypeBox schema export per file under features/*/schemas. Use when adding
  or editing HTTP/OpenAPI request, query, params, or response schemas, or when
  splitting mixed schema modules. Use when the user runs /schema-files.
when-to-use: >
  TypeBox schema, schemas/, BodySchema, QuerySchema, ResponseSchema,
  AuthorizeQuerySchema, one schema per file, split schema file
---

# Schema files

TypeBox OpenAPI shapes for HTTP features. Canonical: `oauth-service` `features/authorize/schemas`. Related: `http-route`, `service-feature`.

## Layout

```text
features/<feature>/schemas/
  <Name>Schema.ts
  index.ts
```

| File                              | Exports                                      |
| --------------------------------- | -------------------------------------------- |
| `FooBodySchema.ts`                | `FooBodySchema`, `type FooBody`              |
| `FooQuerySchema.ts`               | `FooQuerySchema`, `type FooQuery`            |
| `FooParamsSchema.ts`              | `FooParamsSchema`, `type FooParams`          |
| `FooResponseSchema.ts`            | `FooResponseSchema`, `type FooResponse`      |
| `AuthorizeQuerySchema.ts`         | Union only; imports sibling schema files     |
| `AuthorizeOpenApiQuerySchema.ts`  | Flat optional Object for route OpenAPI       |
| `index.ts`                        | Re-exports only                              |

Filename = exported schema const (`InitialAuthorizeQuerySchema.ts` → `InitialAuthorizeQuerySchema`).

## Recipe

1. Put **one** primary `Type.Object` / `Type.Union` / `Type.Intersect` export in its own file.
2. If a route accepts several shapes (initial vs resume, accept vs reject), give **each** shape its own file, then a thin composer file for the union/intersect used by the route.
3. Re-export from `schemas/index.ts`. Routes import from the barrel or the specific file.
4. Keep `{ additionalProperties: false }` on bodies unless Hydra/proxy passthrough needs `true` (document that in the composer only by the option itself).

```ts
import Type from "typebox";

export const InitialAuthorizeQuerySchema = Type.Object(
  {
    response_type: Type.Literal("code"),
    client_id: Type.String({ minLength: 1 }),
    redirect_uri: Type.String({ minLength: 1 }),
    scope: Type.String({ minLength: 1 }),
    state: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export type InitialAuthorizeQuery = Type.Static<typeof InitialAuthorizeQuerySchema>;
```

```ts
import Type from "typebox";
import { ConsentVerifierAuthorizeQuerySchema } from "@/features/authorize/schemas/ConsentVerifierAuthorizeQuerySchema";
import { InitialAuthorizeQuerySchema } from "@/features/authorize/schemas/InitialAuthorizeQuerySchema";
import { LoginVerifierAuthorizeQuerySchema } from "@/features/authorize/schemas/LoginVerifierAuthorizeQuerySchema";

export const AuthorizeQuerySchema = Type.Union([
  InitialAuthorizeQuerySchema,
  LoginVerifierAuthorizeQuerySchema,
  ConsentVerifierAuthorizeQuerySchema,
]);

export type AuthorizeQuery = Type.Static<typeof AuthorizeQuerySchema>;
```

When a route accepts a **union of query shapes**, do **not** put the `Type.Union` on `schema.querystring`. Fastify OpenAPI flattens union members into one parameter list and marks every branch-required field as `required: true`, which breaks Hey API client types. Use:

- `AuthorizeOpenApiQuerySchema` — flat `Type.Object` with each field `Type.Optional(...)` on `schema.querystring` (OpenAPI + Fastify)
- `AuthorizeQuerySchema` — `Type.Union([...])` only in `Value.Check` (real validation)

## Anti-patterns

- Two or more unrelated `Type.Object` schemas in one file (initial + resume, body + response, accept + reject)
- Dumping every feature schema into `schemas.ts` or a single `*Schemas.ts`
- Defining TypeBox route schemas inline in the route file
- Putting schema implementations in `index.ts` (re-exports only)
- Hand-editing `**/__generated__/**` client types instead of source schemas + codegen

## Done when

- Each schema const lives in `<Name>Schema.ts`
- Composed unions/intersects only import siblings; they do not redefine those objects
- `schemas/index.ts` re-exports the public set
- Route `schema.body` / `querystring` / `params` / `response` reference those exports
