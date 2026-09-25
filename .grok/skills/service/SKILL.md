---
name: service
description: >
  Feature application services: I*Service, create/getById/list, authz,
  transactions, outbox. Use when adding domain logic or scheduling outbox events.
when-to-use: >
  IFooService, injectable service, requirePermission, outbox, ApplicationError
---

# Service

Domain layer. Canonical: `platform-service` `features/workspaces/services`. Related: `repository`, `graphql`, `http-route`, `service-feature`, `events`, `outbox`, `authorization`, `testing`.

## Layout

```text
features/<feature>/
  services/
    __tests__/
      FooService.test.ts
    IFooService.ts
    FooService.ts
    index.ts
  errors/
    FooNotFoundError.ts
```

## Interface

Drop the noun already on the type. Domain verbs — not repository `save` / `findById`.

| Method              | Meaning                                                    |
| ------------------- | ---------------------------------------------------------- |
| `create`            | business create (authz + validate + tx + outbox as needed) |
| `getById`           | one; **throws** not-found                                  |
| `list` / `listMine` | many                                                       |
| `update` / `delete` | mutate                                                     |

```ts
export interface IWorkspaceService {
  create: (input: CreateWorkspaceInput, identityId: string) => Promise<Workspace>;
  getById: (id: string, identityId: string) => Promise<Workspace>;
  list: (input: ListWorkspacesInput, identityId: string) => Promise<Workspace[]>;
  listMine: (identityId: string) => Promise<WorkspaceNode[]>;
  update: (id: string, input: UpdateWorkspaceInput, identityId: string) => Promise<Workspace>;
  delete: (id: string, identityId: string) => Promise<void>;
}
```

If the type is not the resource, keep the resource: `IAdminService.createIdentity`. When editing a long-form service (`createIssue`, `getTenantById`), rename **that** service + internal callers only — never GraphQL fields / HTTP `operationId`s in the same cleanup.

## Recipe

Do here: authz (`requirePermission`), conflict checks (`*ConflictError`), `db.transaction` when writes + outbox must be atomic, map rows → event DTOs, `createCloudEvent` + `outboxService.schedule(..., { tx })`, throw feature `ApplicationError` subclasses (`expose: true` when client-safe).

```ts
@injectable()
export class WorkspaceService implements IWorkspaceService {
  constructor(
    @inject(TYPES.WorkspaceRepository)
    private readonly workspaceRepository: IWorkspaceRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async getById(id: string, identityId: string): Promise<Workspace> {
    await requirePermission(this.authorizationClient, identityId, "read", `workspace:${id}`);
    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) {
      throw new WorkspaceNotFoundError(`Workspace not found: ${id}`);
    }
    return workspace;
  }
}
```

```ts
export class WorkspaceNotFoundError extends ApplicationError {
  constructor(message = "Workspace not found") {
    super("WORKSPACE_NOT_FOUND", message, true);
  }
}
```

Keep the noun on error class names. TYPES + bind:

```ts
TYPES.WorkspaceService = Symbol.for("IWorkspaceService");
container.bind<IWorkspaceService>(TYPES.WorkspaceService).to(WorkspaceService);
```

| Transport                 | Call                            |
| ------------------------- | ------------------------------- |
| GraphQL `createWorkspace` | `workspaceService.create(...)`  |
| GraphQL `getWorkspace`    | `workspaceService.getById(...)` |
| HTTP handler              | same short verbs                |

Resolvers and routes: one service call after mapping args.

## Anti-patterns

- Repository verbs on the service public API
- Authz only in the resolver / route
- GraphQL / HTTP parsing here
- Publishing unmapped DB rows as CloudEvent data
- Skipping colocated tests for non-trivial tx/outbox paths

## Done when

- `I*Service` + `@injectable()` impl + TYPES + bind
- Authz / tx / outbox live here when needed
- Colocated `*.test.ts` for non-trivial logic
