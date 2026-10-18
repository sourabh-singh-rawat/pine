---
name: docker-infra
description: >
  Local Docker Compose: Postgres, Ory (Kratos/Hydra/Keto), NATS, SeaweedFS,
  single root env. Use when changing compose, ports, or local IdP/authz.
when-to-use: >
  dev:infra, Kratos, Hydra, Keto, compose.yaml, SeaweedFS, root .env
---

# Docker infra

Local compose under `infra/docker/`. Run commands: `dev-loop`. Related: `observability`, `k8s`, `identity-auth`, `authorization`.

## Env

Root `.env` / `.env.example` holds everything: compose secrets, app runtime, Vite `VITE_*`. No per-package env files. Compose always uses `--env-file .env`.

```bash
cp .env.example .env
```

Set each `POSTGRES_*_PASSWORD`. Apps need full `<DOMAIN>_DATABASE_URL` (`postgres://{role}:{password}@localhost:5432/{db}`).

## Commands

| Script                                | Stack                                                |
| ------------------------------------- | ---------------------------------------------------- |
| `pnpm dev:infra` / `:down`            | `compose.yaml` (Postgres, Ory, SeaweedFS, NATS, …) |
| `dev:infra:observability`             | same + `--profile observability`                   |
| `dev:infra:kratos` / `:hydra` / `:keto` | starts Postgres + Kratos/Hydra/Keto only         |

One compose file: `infra/docker/compose.yaml`. Extend it; do not invent new overlay basenames for day-to-day local infra.

## Ports

Confirm in active compose + `.env.example`.

| Host        | Service                          |
| ----------- | -------------------------------- |
| 5432        | Postgres (app + Ory databases)   |
| 4222 / 8222 | NATS client / monitor            |
| 9200 / 9600 | OpenSearch REST / Performance Analyzer |
| 4433 / 4434 | Kratos public / admin            |
| 4444 / 4445 | Hydra public / admin             |
| 4466 / 4467 | Keto read / write                |
| 4317 / 3300 | Alloy OTLP / Grafana (obs profile) |
| 8333 / 8888 | SeaweedFS S3 / filer UI          |

Observability configs live under `infra/docker/{alloy,loki,tempo,prometheus,grafana}/` (same per-service folder style as `kratos/`, `hydra/`, `keto/`).

NATS JetStream is enabled (`-js`, store dir `/data` → `infra/data/docker/nats-jetstream`). Streams are **not** created by apps. `nats-streams-init` (nats-box one-shot, same pattern as `seaweedfs-init`) creates `attachment`, `authorization`, `identity`, `items`, and `platform` after NATS is healthy — same five names as `infra/k8s/nats/` Stream CRs. Host fallback: `pnpm nats:streams`. Durable consumers stay app-owned via `Consumer.start()`.

## Object storage

SeaweedFS lives in `compose.yaml`. Env: `S3_ENDPOINT=http://127.0.0.1:8333`, `S3_BUCKET=attachments`, `S3_ACCESS_KEY` / `S3_SECRET_KEY` (defaults `seaweed`). `seaweedfs-init` CreateBuckets `S3_BUCKET` after S3 is healthy.

Upload “completed” but `NoSuchBucket` on read: broken bucket under `infra/data/docker/seaweedfs-data`. Recreate `attachments` (`DeleteBucket` + `CreateBucket`) or wipe that data dir and re-run `pnpm dev:infra` — confirm with the user first.

## Ory

Config: `infra/docker/kratos/`, `infra/docker/hydra/`, `infra/docker/keto/`. App URLs: `KRATOS_*_URL`, `HYDRA_*_URL`, `KETO_READ_URL` / `KETO_WRITE_URL` in root `.env`. `KRATOS_SECRETS_CIPHER` must be **32 chars**.

Keto datastore: role/DB `keto` on Compose `postgres` in `compose.yaml` (`POSTGRES_KETO_PASSWORD`). Namespaces: OPL in `services/authorization-service/src/integrations/authorization/ory-keto/opl/namespaces.ts`. File-bind `keto/keto.yaml` + mount OPL at `/etc/config/keto/opl` — do not nest that mount under a read-only bind of `keto/`. `namespaces.location` points at that single `.ts` file. Class names are namespace strings (`identity`, `platform`, `tenant`, …). No parallel `id`/`name` list. Switching from a static list to OPL changes namespace IDs — recreate the `keto` database (or wipe `pg-single-db-data`) before relying on existing tuples.

Init scripts apply only on **fresh** volumes. After openfga→keto, recreate that Postgres volume (or create `keto` role/DB manually) if migrate fails.

Kratos mail: root `.env` only — never secrets in `kratos.yaml`.

- `BREVO_EMAIL` → `COURIER_SMTP_FROM_ADDRESS`
- `COURIER_SMTP_CONNECTION_URI` → Brevo SMTP relay
- `COURIER_SMTP_FROM_NAME` (optional, default `Pine`)
- Templates under `kratos/courier-templates/` rewrite Kratos `VerificationURL` (`:4433/self-service/verification?...`) to `http://localhost:3000/verification?code=…&flow=…`

## Anti-patterns

- Ad-hoc compose flags instead of root `pnpm` scripts
- New compose overlay basenames for local day-to-day infra
- Per-package `.env` files
- Searching `infra/data/` for product code
- Volume/DB wipes without confirming with the user
- Per-service Postgres on the laptop (removed `compose.multi-db.yaml`)

## Done when

- Change uses `pnpm dev:infra*` against `compose.yaml`
- Root `.env.example` updated when ports/secrets/URLs change
- Ory/Keto mounts and `namespaces.location` still match
