---
name: k8s
description: >
  Helm/K8s under infra/k8s: microservice chart, PGO Postgres, NATS streams and
  consumers. Use when changing cluster deploy values or JetStream resources.
when-to-use: >
  helm, deploy, nats, nats-consumer, GKE, infra/k8s, microservice values
---

# Kubernetes

Playbook: `docs/commands/install-k8s.md`. GKE: `docs/commands/gcloud.md`. Local dev: `docker-infra`, not these charts. Related: `events`, `workers`.

## Layout

```text
infra/k8s/
  pine/                (Namespace pine + ReferenceGrant for Gateway → Services)
  envoy/
  openbao/
  pgo/                 (operator + PostgresCluster YAMLs)
  external-secrets/    (ESO + SecretStore + ExternalSecrets)
  nats/                (Helm values + nack + Stream CRs)
  microservice/   (planned)
  nats-consumer/  (planned; optional durable CRs — handlers stay in apps)
  dashboard/  (planned)
```

## Namespaces

Two Pine app namespaces; operators keep upstream defaults.

| Namespace | Owns |
| --------- | ---- |
| `pine` | Microservices, PostgresClusters, ExternalSecrets, `*-secrets` |
| `pine-gateway` | Gateway `pine`, HTTPRoutes |
| `envoy-gateway-system` | Envoy Gateway Helm (`eg`) |
| `openbao` | OpenBao Helm |
| `postgres-operator` | PGO Helm (`pgo`) |
| `external-secrets` | ESO Helm |
| `nats` | NATS + nack + Stream CRs |

Apply `./k8s/pine/` after Envoy CRDs so ReferenceGrant can exist. HTTPRoutes target Services in `pine` (not `pine-gateway`).

## Recipe

Install order: Envoy Gateway → `./k8s/pine/` → OpenBao (init/unseal/seed) → PGO (operator + clusters) → copy DB passwords into OpenBao → External Secrets → NATS (server + nack + streams) → Microservices. Durables are still created by app `Consumer.start()` unless/until `nats-consumer` mirrors them.

Envoy Gateway: install commands in `infra/k8s/envoy/README.md`. Helm `oci://docker.io/envoyproxy/gateway-helm` v1.9.1 release `eg` in `envoy-gateway-system`, then apply `gateway.yaml`, `./k8s/pine/`, and `httproutes.yaml` (`/api` → `api-gateway.pine:4000`, `/data` → `data-gateway.pine:4001`, prefixes stripped).

OpenBao: install and `bao` init/unseal lab in `infra/k8s/openbao/README.md`. Helm `openbao/openbao` release `openbao` in namespace `openbao` with `server.replicas=1`. After install, `kubectl exec -it openbao-0 -n openbao` and run `bao operator init` / `unseal` (staging often uses `-key-shares=1 -key-threshold=1`). Local laptop still uses root `.env` only.

PGO: `infra/k8s/pgo/README.md` — upstream OCI `helm install pgo … -n postgres-operator`, then `kubectl apply -f ./k8s/pgo/ -n pine`. User Secrets are `{cluster}-pguser-{user}` (items keeps DB user `issues`). Copy passwords into OpenBao once.

External Secrets: `infra/k8s/external-secrets/README.md` — Helm `external-secrets/external-secrets` in `external-secrets`, SecretStore `openbao` + ExternalSecrets in `pine` mapping `secret/pine/<app>` → `*-secrets` with `.env` key names (`POSTGRES_*`, `S3_*`). Apps `envFrom` those Secrets only.

NATS: `infra/k8s/nats/README.md` — upstream `nats/nats` Helm + nack + Stream CRs in one folder (`values.yaml`, then `kubectl apply -k ./k8s/nats/`). Namespace `nats`, JetStream `1Gi` PVC, single replica. URL `nats://nats.nats.svc:4222`. Streams: `attachment`, `authorization`, `identity`, `items`, `platform`. Apps must not `ensureStream`. Laptop: Compose + `pnpm nats:streams`.

Stream names must match `@pine/events` `Streams`. CloudEvent `type` examples: `items.item.created`, `identity.user.registered`. Durable consumer names stay service-local in app code.

New event on cluster:

1. Code: `@pine/events` (`events`)
2. Stream CR under `infra/k8s/nats/` if the first type token is new (and laptop ensure script)
3. Consumer class in the consuming service (optional later: `nats-consumer` CR mirror)
4. Names match CloudEvent `type` and durable conventions

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
