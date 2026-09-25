---
name: web-feature
description: >
  React features in pine-web / identity-web / platform-web: TanStack routes,
  .gql ops, codegen, Zustand. Use when adding a page, route, or client operation.
when-to-use: >
  add page, TanStack route, CreateWorkspace.gql, gen:gql, gen:api, Zustand,
  useGetWorkspaceQuery
---

# Web feature

Canonical: `apps/pine-web` (same patterns on `identity-web`, `platform-web`). Stack: React 19, Vite, MUI, TanStack Router/Query, Zustand, GraphQL codegen, Hey API. Related: `graphql`, `http-route`, `schema-codegen`, `material-design-3`.

Server field names: `graphql`. REST `operationId`s: `http-route`. Client operations must match that identifier.

## Layout

```text
src/
  features/<domain>/{components,pages,store}/
  routes/(no-auth)|_authenticated/
  graphql/<domain>/*.gql
  __generated__/{gql,api,routeTree.gen.ts}
  shared/  bootstrap/
```

Routes are thin (page import only). `src/graphql/<domain>/` matches the server feature (`workspaces`, `tenants`, `identities`). Legacy singular folders (`issue`, `project`) stay until a dedicated rename.

## Recipe

1. **UI** under `features/<domain>/`; export from feature `index.ts`. Same problem as the server feature.
2. **Route** under the correct auth group; match existing URL patterns (`i.$issueId`, `$workspaceId`, …).

```ts
export const Route = createFileRoute("/_authenticated/i/$issueId")({
  component: IssuePage,
});
```

3. **GQL** in `src/graphql/<domain>/X.gql`. File name and operation = PascalCase of the **server field**.

| Server field      | Client file           | Operation                  |
| ----------------- | --------------------- | -------------------------- |
| `getWorkspace`    | `GetWorkspace.gql`    | `query GetWorkspace`       |
| `getWorkspaces`   | `GetWorkspaces.gql`   | `query GetWorkspaces`      |
| `createWorkspace` | `CreateWorkspace.gql` | `mutation CreateWorkspace` |

Existing `FindIssue` / `FindProjects` match current `find*` server fields — leave until the schema is renamed.

```bash
pnpm schemas:compose
pnpm --filter @pine/pine-web gen
```

Supergraph: `services/api-gateway/dist/supergraph.graphql`. Same `gen` / `gen:gql` / `gen:api` on `identity-web` and `platform-web`.

4. **State:** server → generated React Query hooks; UI → existing Zustand under feature `store/`.

Hooks: `useXQuery` / `useXMutation` from `@generated/api/@tanstack/react-query.gen` or `@generated/gql`. Do not wrap `*Options` / `*Mutation` factories with `useQuery` / `useMutation` in components (factories are for prefetch, queryClient, tests). Assign the hook return; do not destructure (`const workspaceQuery = useGetWorkspaceQuery(...); workspaceQuery.data`). Enforced by `pine/no-destructure-query-mutation`.

Prefer `@pine/ui` + MUI + `shared` primitives. Build: `pnpm exec turbo run build --filter=@pine/<app>`.

## Anti-patterns

- Hand-copied server types or hand-edited `__generated__/`
- `useQuery({ ...xOptions(...) })` / `useMutation(xMutation())` in components
- Destructured `{ data, isLoading }` from query/mutation hooks
- Client operation name that does not match the server field / `operationId`
- `@pine/forms` or a second UI kit

## Done when

- Feature UI + thin route + matching `.gql` (when server data)
- Generated hooks used without destructuring
- `gen` / `gen:gql` / `gen:api` run when schemas or OpenAPI changed
- Filtered turbo build for the touched app is green
