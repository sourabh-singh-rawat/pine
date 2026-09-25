---
name: http-route
description: >
  Fastify HTTP routes via @pine/server: HttpRoute, operationId, TypeBox schemas,
  thin handlers. Use when adding or changing a REST/OpenAPI route.
when-to-use: >
  HttpRoute, operationId, OpenAPI route, TypeBox schema, routes/index
---

# HTTP route

REST / OpenAPI transport. Canonical: `authorization-service` `features/authorization/routes`. Also: `identity-service` `features/verification`, `attachment-service` `features/attachment-upload`. Related: `service`, `service-feature`, `graphql`, `identity-auth`, `schema-codegen`.

## Layout

```text
features/<feature>/
  routes/
    checkRelationship.ts
    index.ts
  schemas/
    CheckRelationshipBodySchema.ts
    CheckRelationshipResponseSchema.ts
    index.ts
services/<svc>/src/routes/index.ts
```

One operation per route file. Feature barrel: `export const <feature>Routes: HttpRoute[]`. Service `src/routes/index.ts` spreads feature arrays.

## Naming

Filename = exported const = `operationId`. Client codegen uses that name.

| Piece         | Example                                                          |
| ------------- | ---------------------------------------------------------------- |
| File          | `checkRelationship.ts`                                           |
| Export        | `export const checkRelationship`                                 |
| `operationId` | `"checkRelationship"`                                            |
| URL           | namespaced path is separate (`/authorization/checkRelationship`) |

Do not invent a second name (`consent.ts` + `operationId: "getConsentChallenge"`). New reads prefer `get*` (`getAttachmentContent`, `getIdentityFromSession`).

## Recipe

TypeBox schemas under `features/<feature>/schemas/`; `{ additionalProperties: false }` on bodies. Validate body/query; throw feature errors on bad input. Handler: map args → **one** service method → `json(response)` / cookies. Authenticated routes read `request.identity` or throw `UnauthorizedError`. Public routes need OpenAPI tags/summary/description.

```ts
export const checkRelationship: HttpRoute = {
  url: "/authorization/checkRelationship",
  method: "POST",
  schema: {
    tags: ["authorization"],
    summary: "Check a graph relationship",
    operationId: "checkRelationship",
    body: CheckRelationshipBodySchema,
    response: { 200: CheckRelationshipResponseSchema },
  },
  handler: async (request) => {
    const body = request.body;
    if (!Value.Check(CheckRelationshipBodySchema, body)) {
      throw new InvalidCheckRelationshipBodyError();
    }

    const service = container.get<IAuthorizationService>(TYPES.AuthorizationService);
    const allowed = await service.hasRelationship(body);
    return json({ allowed });
  },
};
```

```ts
export const authorizationRoutes: HttpRoute[] = [
  checkRelationship,
  ensureRelationship,
  deleteRelationship,
  listRelationships,
];
```

## Anti-patterns

- File name ≠ export ≠ `operationId`
- Domain logic or transactions in the handler
- Per-package env files (`docker-infra`: root `.env` only)
- Mutating routes without TypeBox body schemas

## Done when

- File = export = `operationId`
- Feature `*Routes` array + service `routes/index.ts` wired
- Handler calls the feature service only
