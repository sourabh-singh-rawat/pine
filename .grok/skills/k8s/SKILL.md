---
name: k8s
description: >
  Helm/K8s under infra/k8s: microservice chart, PGO Postgres, NATS streams and
  consumers. Use when changing cluster deploy values or JetStream resources.
when-to-use: >
  helm, deploy, nats-consumer, nats-stream, GKE, infra/k8s, microservice values
---

# Kubernetes

Playbook: `docs/commands/install-k8s.md`. GKE: `docs/commands/gcloud.md`. Local dev: `docker-infra`, not these charts. Related: `events`, `workers`.

## Layout

```text
infra/k8s/
  envoy-gateway/
  microservice/
  postgres/  pgo/
  nats/  nats-stream/  nats-consumer/
  secrets/  dashboard/
```

## Recipe

Install order: Dashboard (optional) → Envoy Gateway → Secrets → PGO → per-service Postgres → NATS + nack → Streams → Consumers → Microservices.

Envoy Gateway: install commands in `infra/k8s/envoy-gateway/README.md`. Helm `oci://docker.io/envoyproxy/gateway-helm` v1.9.1 release `eg` in `envoy-gateway-system`, then apply `gateway.yaml` and `httproutes.yaml` (`/api` → api-gateway:4000, `/data` → data-gateway:4001, prefixes stripped).
Stream/consumer names must match `@pine/events` `Streams` (`identity`, `issues`, `attachment`, `platform`, `authorization`). CloudEvent `type` examples: `issues.issue.created`, `identity.user.registered`.

Edit values; do not fork the chart:

```yaml
replicaCount: 1
container:
  image: sourabhrawatcc/<service>
  exposedPort: 4000
jwtSecretRef: jwt-secret
```

Env secrets from PGO user secret `{release}-postgres-pguser-{release}-postgres` (+ optional JWT/SMTP refs). Values files still use some legacy names (`issue-tracker`) — map to current packages (`notification-service` for notifications).

New event on cluster:

1. Code: `@pine/events` (`events`)
2. `nats-stream` if new stream
3. `nats-consumer/values/*.yaml` durable
4. Names match CloudEvent `type` and consumer durable conventions

Image/tag changes in values only. Committed secrets are templates. Destructive ops (delete release, scale cluster to 0) → confirm with the user.

## Anti-patterns

- Forking the microservice chart per service
- Hand-applied Deployments that duplicate the chart
- Durable / stream names that diverge from `@pine/events`
- Committing real production secrets

## Done when

- Values/charts match current package and event names
- Stream + consumer resources exist when the code path needs them
- No hand-applied duplicate Deployments
