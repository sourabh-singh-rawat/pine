---
name: outbox
description: >
  @pine/outbox transactional outbox: schedule CloudEvents in the same DB
  transaction, OutboxWorker publish loop, cleanup worker. Use when persisting
  events atomically or wiring outbox workers.
when-to-use: >
  outbox, IOutboxService, OutboxWorker, OutboxCleanupWorker, schedule event,
  outbox_messages, claimBatch
---

# Outbox

Transactional outbox in `@pine/outbox`. Canonical wiring: `platform-service` `bootstrap/container.ts` + `features/workspaces`. Related: `service`, `events`, `workers`, `drizzle`.

Write path: `createCloudEvent` + `outboxService.schedule(..., { tx })` inside `db.transaction`. Publish path: `OutboxWorker` claims due rows and `publisher.send`s the stored CloudEvent. Do not `publisher.send` from the service when the write must be atomic.

## Layout

Re-export `OutboxMessages` from the service `src/db/schema.ts` (and `src/db/index.ts` when that barrel exists). Table lives in `@pine/outbox` — do not copy it.

```ts
export { OutboxMessages } from "@pine/outbox";
```

## Recipe — schedule

```ts
const created = createCloudEvent({
  type: WorkspaceCreatedEvent.type,
  version: WorkspaceCreatedEvent.version,
  schema: WorkspaceCreatedEvent.schema,
  source: "pine/platform-service",
  subject: workspace.id,
  data: mappedWorkspaceCreatedDto,
});

await this.outboxService.schedule(
  {
    eventId: created.id,
    eventType: created.type,
    eventVersion: WorkspaceCreatedEvent.version,
    aggregateType: "workspace",
    aggregateId: workspace.id,
    payload: created,
  },
  { tx },
);
```

`payload` is the CloudEvent object (must include string `type`). `eventId` = CloudEvent `id` (unique). Same `tx` as the aggregate write.

## Recipe — workers

Bind package types; `NatsPublisher` is `IOutboxPublisher` (`satisfies IOutboxPublisher`). Start after `broker.init()`:

```ts
container.bind<IOutboxRepository>(TYPES.OutboxRepository).toConstantValue(new OutboxRepository(db));
container.bind<IRetryPolicy>(TYPES.RetryPolicy).toConstantValue(new ExponentialBackoffPolicy());
container
  .bind<IOutboxService>(TYPES.OutboxService)
  .toConstantValue(
    new OutboxService(
      container.get<IOutboxRepository>(TYPES.OutboxRepository),
      container.get<IRetryPolicy>(TYPES.RetryPolicy),
    ),
  );
container
  .bind<IOutboxWorker>(TYPES.OutboxWorker)
  .toConstantValue(new OutboxWorker(container.get<IOutboxService>(TYPES.OutboxService), publisher));
container
  .bind<IOutboxCleanupService>(TYPES.OutboxCleanupService)
  .toConstantValue(
    new OutboxCleanupService(container.get<IOutboxRepository>(TYPES.OutboxRepository)),
  );
container
  .bind<IOutboxCleanupWorker>(TYPES.OutboxCleanupWorker)
  .toConstantValue(
    new OutboxCleanupWorker(container.get<IOutboxCleanupService>(TYPES.OutboxCleanupService)),
  );
```

```ts
void container.get<IOutboxWorker>(TYPES.OutboxWorker).start();
void container.get<IOutboxCleanupWorker>(TYPES.OutboxCleanupWorker).start();
```

Defaults: worker poll 1s, batch 50; cleanup poll 1h, published rows older than 7 days. Failed publishes use `ExponentialBackoffPolicy` via `outboxService.failed`.

Dedicated worker services (no HTTP) still start these two plus their NATS consumers — `attachment-scanner-service` `main.ts`.

## Anti-patterns

- `publisher.send` in the same use-case as a DB write (skips the outbox)
- Scheduling outside the transaction that wrote the aggregate
- Copying `outbox_messages` into the service instead of re-exporting `OutboxMessages`
- A custom poll loop when `OutboxWorker` already exists
- Payload that is a raw DB row or missing CloudEvent `type`

## Done when

- `OutboxMessages` is in the service schema
- Domain events go through `schedule` + `{ tx }`
- `OutboxWorker` + `OutboxCleanupWorker` bound and `start()`ed from `main.ts`
