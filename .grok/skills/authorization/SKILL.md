---
name: authorization
description: >
  Graph authorization: Keto OPL namespaces, requirePermission, relation tuples
  via events. Use when checking permissions, adding a relation, or changing
  namespaces.
when-to-use: >
  requirePermission, Keto, relation tuple, IAuthorizationClient,
  ensureRelationship, organization:id, InsufficientPermissionError, OPL namespace
---

# Authorization

Checks in the owning service; tuple writes in `authorization-service` consumers. Canonical check: `platform-service` `OrganizationService.getById`. Canonical HTTP: `authorization-service` `features/authorization`. OPL: `services/authorization-service/src/integrations/authorization/ory-keto/opl/namespaces.ts`. Related: `service`, `events`, `http-route`, `docker-infra`.

Resource key: `` `${namespace}:${id}` `` (`organization:…`, `tenant:…`, `platform:…`, `profile:…`). Namespaces and permits live in OPL class names (`identity`, `profile`, `platform`, `tenant`, `organization`). Permissions are OPL `permits` keys (`read`, `manage_members`, `create_organization`, …) — see `@pine/authorization` `ORGANIZATION_PERMISSIONS` / `TENANT_PERMISSIONS` / `PLATFORM_PERMISSIONS`.

## Recipe — check

```ts
await requirePermission(this.authorizationClient, identityId, "read", `organization:${id}`);
```

Throws `InsufficientPermissionError`. Inject `IAuthorizationClient` (`HttpAuthorizationClient` → `AUTHORIZATION_SERVICE_URL`). Do this in the **service**, not the resolver/route.

Helpers for tuple shapes: `organizationOwnerRelationship`, `tenantMemberRelationship`, `platformAdminRelationship`, … in `@pine/authorization`.

## Recipe — write tuples

Product services do **not** call `ensureRelationship` / `deleteRelationship` on the HTTP client for domain membership. They `requirePermission`, then `outbox.schedule` a relation CloudEvent (`OrganizationRelationCreatedEvent`, …). `authorization-service` consumers map that event to Keto (`features/platform/consumers`, `features/identity/consumers`).

Direct graph HTTP (`checkRelationship`, `ensureRelationship`, `deleteRelationship`, `listRelationships`) is the authorization-service API (`http-route`). Use `HttpAuthorizationClient` from other services for **checks**.

New namespace or permit: edit OPL + `@pine/authorization` resource/permission unions + relation helpers in the same change. OPL mount: `docker-infra`. Switching namespace IDs requires recreating the keto DB (confirm with the user).

## Anti-patterns

- Authz only in GraphQL/HTTP
- Writing Keto tuples from `platform-service` / `items-service` via `ensureRelationship`
- Inventing a resource string that is not `namespace:id`
- Parallel `id`/`name` namespace lists beside OPL
- Calling Keto from a feature folder in a non-authorization service

## Done when

- Checks use `requirePermission` in the service
- Tuple changes ride outbox events consumed by `authorization-service`
- New permits exist in OPL and `@pine/authorization` types
