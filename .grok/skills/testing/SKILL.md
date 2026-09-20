---
name: testing
description: >
  Vitest for services: colocated *.test.ts, constructor doubles, no as/any.
  Use when adding or changing unit tests for services, repositories, routes,
  or consumers.
when-to-use: >
  vitest, FooService.test.ts, vi.fn, constructor double, unit test, colocated
  test
---

# Testing

Colocated unit tests under `__tests__/` next to the impl (`__tests__/FooService.test.ts`). Canonical: `platform-service` `features/workspaces/services/__tests__/WorkspaceService.test.ts`. Related: `service`, `repository`, `http-route`, `events`, `outbox`. Run: `pnpm exec turbo run test --filter=@pine/<package>`.

Do not boot compose, Kratos, or NATS for these tests. Construct the class with fakes; do not resolve the real Inversify container.

## Recipe

Stub every constructor dependency with `vi.fn()` implementations that satisfy the interface — no `as`, `as never`, or `any`.

```ts
const createWorkspaceRepository = (
  overrides: Partial<IWorkspaceRepository> = {},
): IWorkspaceRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByIds: vi.fn(),
  findMany: vi.fn(),
  existsBySlugInTenant: vi.fn(),
  softDelete: vi.fn(),
  ...overrides,
});

const createAuthorizationClient = (
  overrides: Partial<IAuthorizationClient> = {},
): IAuthorizationClient => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
  deleteRelationship: vi.fn().mockResolvedValue({ deleted: true }),
  listRelationships: vi.fn().mockResolvedValue([]),
  ...overrides,
});
```

Assert:

- Authz: `checkRelationship` called with `namespace`, `object`, `relation`, `subject: \`identity:${id}\``
- Persistence: repository method + args
- Outbox: `schedule` called with `eventType` / `aggregateId`; not called on conflict/not-found paths
- Errors: `rejects.toBeInstanceOf(WorkspaceNotFoundError)` / `InsufficientPermissionError`

Route/resolver tests stay thin: mock the feature service, not repositories. Consumer tests: mock the feature service + ack; feed a valid CloudEvent.

`vitest.config.ts` already aliases `@/` to `src/`. `vitest.setup.ts` is per-service — reuse it, do not add a second setup.

## Anti-patterns

- `as never` / `as any` / `as unknown as T` to shove partial mocks into constructors
- Hitting the real DB, NATS, or Keto from a colocated unit test
- Testing through the Inversify container
- Asserting GraphQL field names inside a service test
- Skipping tests for tx + outbox / authz branches

## Done when

- New non-trivial service/consumer/route logic has a colocated `*.test.ts`
- Doubles are typed interfaces
- `pnpm exec turbo run test --filter=@pine/<package>` green
