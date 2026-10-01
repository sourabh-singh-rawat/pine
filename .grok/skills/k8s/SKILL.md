---
name: k8s
description: >
  Helm/K8s under infra/k8s: microservice chart, PGO Postgres, NATS streams and
  consumers. Use when changing cluster deploy values or JetStream resources.
when-to-use: >
  helm, deploy, nats, nats-consumer, GKE, infra/k8s, microservice values
---

# Kubernetes

**Canonical runbook:** [`infra/k8s/README.md`](../../../infra/k8s/README.md) — **OCI VM + k3s only** (Linux bash on the VM; no laptop steps in that file). Grow that file for the VM path. Do not add per-folder READMEs. Other environments (local k8s, Compose on a VM) are separate docs (later). Related: `events`, `workers`.

## Layout

```text
infra/k8s/
  README.md            (single install/runbook)
  pine/                Namespace pine + ReferenceGrant
  envoy/               Gateway + HTTPRoutes + BackendTLSPolicy
  openbao/             Helm only (no apply YAMLs)
  pgo/                 Namespace pine-data + PostgresCluster YAMLs (incl. ory)
  external-secrets/    SecretStore + ExternalSecrets
  nats/                Helm values + Stream CRs
  seaweed/             All-in-one SeaweedFS S3
  kratos/ hydra/ keto/ Ory Helm values
  microservice/        Thin chart + per-service values + ocir overlay
  nats-consumer/       (planned)
  dashboard/           (planned)
```

## Namespaces

| Namespace              | Owns                                                                              |
| ---------------------- | --------------------------------------------------------------------------------- |
| `pine`                 | Microservices, ExternalSecrets, `*-secrets`, `pine-ca`, BackendTLSPolicy, SeaweedFS, Kratos, Hydra, Keto |
| `pine-data`            | PostgresClusters, PGO `*-pguser-*` Secrets, DB pods / PVCs                        |
| `pine-gateway`         | Gateway `pine`, HTTPRoutes                                                        |
| `envoy-gateway-system` | Envoy Gateway Helm (`eg`)                                                         |
| `openbao`              | OpenBao Helm                                                                      |
| `postgres-operator`    | PGO Helm (`pgo`) — operator only                                                  |
| `external-secrets`     | ESO Helm                                                                          |
| `nats`                 | NATS + nack + Stream CRs                                                          |

## Recipe

Install order (details and commands in the runbook): set `CLUSTER_NAME` / `PUBLIC_IP` / `PATH` / `KUBECONFIG` per VM → OCI Ampere + Oracle Linux 9 + k3s (disable Traefik, keep firewalld) → Envoy → pine → OpenBao → PGO (incl. `ory` + schema grants) → OpenBao seed + ESO → NATS → SeaweedFS → Kratos/Hydra/Keto → OCIR images (match host arch: linux/amd64 for E5.Flex, linux/arm64 for Ampere A1) + microservices. Same runbook for every new OCI lab VM; section 0 once per VM, 1–8 re-runnable with `helm upgrade --install`.

App images: on the VM, `docker login <region>.ocir.io` (username `<Object-Storage-namespace>/<oci-user>`, password Auth Token) → `pnpm images:push:ocir` (`tools/scripts/oci/push-images.sh`, linux/arm64 on Ampere) → Secret `ocir-pull` + overlay `microservice/ocir.values.yaml` with `--set image.registry=bom.ocir.io/<namespace>` (lowercase; uppercase path → `InvalidImageName`). Home region Mumbai uses `bom` / `bom.ocir.io`. Chart supports `image.registry` + `imagePullSecrets`.

Stream names must match `@pine/events` `Streams`. Apps must not `ensureStream` on cluster. Durables stay in app code unless/until `nats-consumer` mirrors them.

Image/tag changes in values only. Committed secrets are templates. Destructive ops (delete release, scale cluster to 0) → confirm with the user.

## Anti-patterns

- Per-folder READMEs that duplicate the runbook
- Forking the microservice chart per service
- Hand-applied Deployments that duplicate the chart
- Durable / stream names that diverge from `@pine/events`
- Committing real production secrets

## Done when

- Runbook (`infra/k8s/README.md`) matches current OCI VM + k3s install reality
- Values/charts match current package and event names
- Stream + consumer resources exist when the code path needs them
- No hand-applied duplicate Deployments
- Local Windows k8s / VM Compose stay out of this README until those separate docs exist
