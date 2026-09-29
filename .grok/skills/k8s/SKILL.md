---
name: k8s
description: >
  Helm/K8s under infra/k8s: microservice chart, PGO Postgres, NATS streams and
  consumers. Use when changing cluster deploy values or JetStream resources.
when-to-use: >
  helm, deploy, nats, nats-consumer, GKE, infra/k8s, microservice values
---

# Kubernetes

**Canonical runbook:** [`infra/k8s/README.md`](../../../infra/k8s/README.md) (**Linux bash** — Oracle/remote hosts, not PowerShell). Grow that file as we learn. Do not add per-folder READMEs. Local day-to-day: `docker-infra` + Compose, not these charts. Related: `events`, `workers`.

## Layout

```text
infra/k8s/
  README.md            (single install/runbook)
  pine/                Namespace pine + ReferenceGrant
  envoy/               Gateway + HTTPRoutes
  openbao/             Helm only (no apply YAMLs)
  pgo/                 PostgresCluster YAMLs (incl. ory)
  external-secrets/    SecretStore + ExternalSecrets
  nats/                Helm values + Stream CRs
  seaweed/             All-in-one SeaweedFS S3
  kratos/ hydra/ keto/ Ory Helm values
  microservice/        Thin chart + per-service values + ocir overlay
  nats-consumer/       (planned)
  dashboard/           (planned)
```

## Namespaces

| Namespace              | Owns                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `pine`                 | Microservices, PostgresClusters, ExternalSecrets, `*-secrets`, SeaweedFS, Kratos, Hydra, Keto |
| `pine-gateway`         | Gateway `pine`, HTTPRoutes                                                                    |
| `envoy-gateway-system` | Envoy Gateway Helm (`eg`)                                                                     |
| `openbao`              | OpenBao Helm                                                                                  |
| `postgres-operator`    | PGO Helm (`pgo`)                                                                              |
| `external-secrets`     | ESO Helm                                                                                      |
| `nats`                 | NATS + nack + Stream CRs                                                                      |

## Recipe

Install order (details and commands in the runbook): set `CLUSTER_NAME` / `PUBLIC_IP` / `PATH` / `KUBECONFIG` per cluster → OCI Ampere + Oracle Linux 9 + k3s (disable Traefik, keep firewalld) → Envoy → pine → OpenBao → PGO (incl. `ory` + schema grants) → OpenBao seed + ESO → NATS → SeaweedFS → Kratos/Hydra/Keto → OCIR images (linux/arm64) + microservices. Same runbook for every new cluster; section 0 once per VM, 1–8 re-runnable with `helm upgrade --install`.

App images: OCIR via laptop `docker login <region>.ocir.io` (username `<Object-Storage-namespace>/<oci-user>`, password Auth Token) → `pnpm images:push:ocir` (`tools/scripts/oci/push-images.sh`) → cluster Secret `ocir-pull` + overlay `microservice/ocir.values.yaml`. Home region Mumbai uses `bom` / `bom.ocir.io`. Chart supports `image.registry` + `imagePullSecrets`. Do not install Docker on the k3s VM for push.

Stream names must match `@pine/events` `Streams`. Apps must not `ensureStream` on cluster. Durables stay in app code unless/until `nats-consumer` mirrors them.

Image/tag changes in values only. Committed secrets are templates. Destructive ops (delete release, scale cluster to 0) → confirm with the user.

## Anti-patterns

- Per-folder READMEs that duplicate the runbook
- Forking the microservice chart per service
- Hand-applied Deployments that duplicate the chart
- Durable / stream names that diverge from `@pine/events`
- Committing real production secrets

## Done when

- Runbook (`infra/k8s/README.md`) matches current install reality
- Values/charts match current package and event names
- Stream + consumer resources exist when the code path needs them
- No hand-applied duplicate Deployments
