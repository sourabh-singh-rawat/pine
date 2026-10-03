---
name: events
description: >
  @pine/events NATS JetStream: CloudEvent publish/subscribe, TypeBox payloads,
  defineEvent, durable consumers. Use when adding or changing async events.
when-to-use: >
  NATS, JetStream, CloudEvent, defineEvent, createCloudEvent, publisher.send,
  Consumer, durable consumer, validateEvent
---

# Events

CloudEvent envelopes on NATS. Subject = CloudEvent `type` (e.g. `items.item.created`). Related: `service`, `service-feature`, `outbox`, `workers`, `k8s`.

`Streams` enum: `identity`, `items`, `attachment`, `platform`, `authorization`. Stream name = first token of `type`. There is **no** `notification` stream — notification-service consumes `Streams.IDENTITY`.

Prefer `outbox.schedule` for events that must commit with a DB write (`outbox`). Direct `publisher.send` only when there is no aggregate transaction.

## Recipe — publish

```ts
new NatsBroker({ servers, logger })

TYPES.Publisher → new NatsPublisher(broker)
TYPES.Broker → broker
```

Streams are a **deployment** concern (`infra/k8s/nats/` Stream CRs; laptop `nats-streams-init` in Compose, host fallback `pnpm nats:streams`). Brokers only connect. Consumers may listen to streams their process does not publish to.

```ts
const event = createCloudEvent({
  type: ItemCreatedEvent.type,
  version: ItemCreatedEvent.version,
  schema: ItemCreatedEvent.schema,
  source: "pine/items-service",
  subject: item.id,
  data: mappedItemCreatedDto,
});
await this.publisher.send(event);
```

`subject` is the domain resource id, not the NATS subject. Map entity fields onto TypeBox schemas (`ownerUserId` ≠ `createdById`; numbers via `Date.now()`, not `new Date()`).

New event:

1. TypeBox schema under `packages/events/src/services/<service>/schemas/`
2. `defineEvent({ type, version, schema })` next to it
3. Add a `Streams` value only when the first type token is new
4. Add/update the Stream CR under `infra/k8s/nats/` (and laptop Compose `nats-streams-init` / `pnpm nats:streams` list)
5. Publish via outbox (`service`) or `publisher.send`
6. Consumer class + DI + `start()` after `broker.init()`

## Recipe — consumer

Canonical: `platform-service` `features/identities/consumers/PlatformIdentitySyncConsumer.ts`. Colocate under `features/<feature>/consumers/`.

```ts
@injectable()
export class PlatformIdentitySyncConsumer extends Consumer<
  CloudEvent<UserRegisteredData | IdentityEmailVerifiedData>
> {
  readonly stream = Streams.IDENTITY;
  readonly consumer = "platform-identity-sync";
  readonly subjects = [UserRegisteredEvent.type, IdentityEmailVerifiedEvent.type];

  constructor(
    @inject(TYPES.Broker) private readonly broker: IBroker,
    @inject(TYPES.IdentityRepository) private readonly identityRepository: IIdentityRepository,
  ) {
    super(broker);
  }

  async onMessage(
    message: JsMsg,
    payload: CloudEvent<UserRegisteredData | IdentityEmailVerifiedData>,
  ): Promise<void> {
    if (payload.type === UserRegisteredEvent.type) {
      const event = validateEvent(UserRegisteredEvent, payload);
      await this.identityRepository.upsert({ id: event.data.userId });
      message.ack();
      return;
    }

    if (payload.type === IdentityEmailVerifiedEvent.type) {
      const event = validateEvent(IdentityEmailVerifiedEvent, payload);
      await this.identityRepository.upsert({ id: event.data.userId });
      message.ack();
    }
  }
}
```

`start()` from `main.ts` after `broker.init()`. Always `validateEvent` + `message.ack()`. Group related types on one durable when they sync the same entity.

`Consumer` takes `IBroker` (not bare `client`) so it can use `getConfig().logger`. `ensureConsumer` retries NATS `TIMEOUT` with backoff, uses a 10s JetStream timeout, logs failures through the broker logger, and does not rethrow from `start()` so `void consumer.start()` will not crash the process on a failed ensure.

## Durable consumers

All JetStream consumers are durable. Names are **service-local** — never in `@pine/events`, never a shared `CONSUMERS` / `SUBJECTS` file.

`readonly consumer` is both `name` and `durable_name`. Convention: `<service>-<purpose>` (consuming service token).

| Service token   | Example                        |
| --------------- | ------------------------------ |
| `platform`      | `platform-identity-sync`       |
| `items`         | `items-identity-sync`          |
| `attachment`    | `attachment-identity-sync`     |
| `notification`  | `notification-identity-sync`   |
| `authorization` | `authorization-workspace-sync` |

Purpose is the projection, not one durable per event verb. One durable name per consumer class; never share across services.

## Anti-patterns

- Publish ORM rows / `UpdateResult` / bare objects
- Parallel `SUBJECTS` / `CONSUMERS` constants in shared packages
- Durable names owned by the producing service
- Skipping `validateEvent` / ack
- Inventing a `notification` (or other) stream that is not on `Streams`
- Creating streams inside app/bootstrap code (`NatsBroker` / `ensureStream`)
- Import `@pine/event-bus`

## Done when

- `defineEvent` + TypeBox schema exist before publish
- Consumer extends `Consumer`, uses `Streams.*` + `SomeEvent.type`, `validateEvent`, ack
- Durable name is inline, service-local, started from `main.ts`
- New stream names exist in `infra/k8s/nats/` (and the laptop ensure script) before apps publish
