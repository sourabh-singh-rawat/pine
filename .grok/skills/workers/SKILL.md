---
name: workers
description: >
  Background process kinds in Pine: outbox pollers, NATS consumers, dedicated
  worker services. Use when adding a worker, poll loop,
  or scanner-style service.
when-to-use: >
  worker, background job, poll loop, OutboxWorker,
  attachment-scanner, attachment-processing, dedicated worker service
---

# Workers

Pick an existing kind. Do not invent a new queue for domain events. Related: `outbox`, `events`, `service-feature`, `k8s`.

| Kind                     | When                                                | Where                                                                           |
| ------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| Outbox poller            | Publish events that were committed with a DB write  | `OutboxWorker` / `OutboxCleanupWorker` in the **same** service (`outbox`)       |
| NATS consumer            | React to another service’s CloudEvent               | `features/<feature>/consumers/` (`events`)                                      |
| Dedicated worker service | Work that should not sit on an HTTP/GraphQL process | `attachment-scanner-service`, `attachment-processing-service` (broker + consumers) |

## Recipe

**Domain event after a write:** `outbox` (schedule in tx) + `OutboxWorker.start()` in `main.ts`.

**Projection / side effect from an event:** `events` consumer, durable name `<service>-<purpose>`, `start()` after `broker.init()`.

**CPU / IO that must scale separately:** dedicated service. Scanner shape: `initializeDb` → `broker.init()` → outbox workers → consumers (`attachment-scanner-service`). Consumer-only (no outbox) is valid — `notification-service`, `attachment-processing-service`. No Fastify unless it truly needs HTTP.

**Image variants / processing:** dedicated consumer in `attachment-processing-service` (`AttachmentCreatedConsumer`).

Start workers with `void worker.start()` from `main.ts` after dependencies are ready. Cluster: NATS consumers need `nats-consumer` charts (`k8s`); outbox pollers run inside the microservice process (no extra chart).

## Anti-patterns

- BullMQ / Redis for CloudEvents (use outbox + NATS)
- HTTP handler that blocks on malware scan / image resize
- A new dedicated service that only wraps `OutboxWorker` for a GraphQL service
- `setInterval` pollers beside `OutboxWorker`
- Starting consumers before `broker.init()`

## Done when

- The work matches one row in the table above
- `start()` is in `main.ts` after DB/broker init
- Domain events still go through `outbox` + `events`
