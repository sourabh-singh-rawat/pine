---
name: schema-codegen
description: >
  GraphQL/OpenAPI compose and client codegen: schemas:compose, gen:gql,
  gen:api. Use when a schema or operation changed and generated clients
  must be refreshed.
when-to-use: >
  schemas:compose, supergraph.graphql, gen:gql, gen:api, graphql-codegen,
  openapi-ts, codegen
---

# Schema codegen

One pipeline: service schema → supergraph/OpenAPI → app clients. Related: `graphql`, `http-route`, `web-feature`, `dev-loop`. `api-gateway` composes subgraphs; it does not own feature fields.

## Recipe

1. Service build/start writes `services/<svc>/dist/schema.graphql` (Pothos) and/or `dist/openapi.json`.
2. Compose into the gateway artifacts:

```bash
pnpm schemas:compose
```

Output: `services/api-gateway/dist/supergraph.graphql` (+ composed OpenAPI).

**Local `pnpm dev` / `dev:apps` already runs `@pine/schemas` `dev`**, which is `compose-schemas --watch`. Subgraph schema changes recompose automatically; api-gateway hot-reloads the supergraph. Standalone watch: `pnpm schemas:watch` or `turbo run dev --filter=@pine/schemas`.

3. App clients (after the supergraph exists) — still explicit:

```bash
pnpm --filter @pine/pine-web gen
```

Same `gen` / `gen:gql` / `gen:api` on `identity-web` and `platform-web`. `gen` = GraphQL codegen + Hey API OpenAPI. Supergraph path for GQL: `services/api-gateway/dist/supergraph.graphql`.

Field / `operationId` names are owned by the server (`graphql`, `http-route`). Client `.gql` operation names are PascalCase of that identifier (`web-feature`).

Never hand-edit `**/__generated__/**` or `api-gateway/dist/*`. If codegen is stale, re-run compose + `gen` — do not patch the output.

## Anti-patterns

- Running `gen:gql` before a successful compose when the supergraph is missing
- Hand-copying server types into the app
- Inventing a client operation name that does not match the server field / `operationId`
- Editing `graphql-codegen.ts` / `openapi-codegen.ts` to paper over a server rename
- Leaving `@pine/schemas` out of a custom `turbo run dev` filter set when you expect a fresh supergraph

## Done when

- Supergraph (and OpenAPI, if REST) includes the new field/op
- Touched apps have regenerated hooks
- No manual edits under `__generated__/` or `api-gateway/dist/`
