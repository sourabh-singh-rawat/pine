---
name: docker-infra
description: >
  Local Docker Compose: Postgres, Ory (Kratos/Hydra/Keto), NATS, SeaweedFS,
  single root env. Use when changing compose overlays, ports, or local IdP/authz.
when-to-use: >
  dev:infra, Kratos, Hydra, Keto, compose overlay, single-db, multi-db,
  SeaweedFS, root .env
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
| `pnpm dev:infra` / `:down`            | compose + single-db + ory-db + kratos + hydra + keto |
| `dev:infra:multi-db`                  | multi-db overlay                                     |
| `dev:infra:observability`             | + Alloy/Tempo/Loki/Grafana                           |
| `dev:infra:kratos` / `hydra` / `keto` | Ory identity + OAuth + graph auth                    |

Overlays: `compose.yaml`, `compose.single-db.yaml` (default), `compose.multi-db.yaml`, `compose.ory-db.yaml`, `compose.kratos.yaml`, `compose.hydra.yaml`, `compose.keto.yaml`. Extend these; do not invent new basenames.

## Ports

Confirm in active compose + `.env.example`.

| Host        | Service                          |
| ----------- | -------------------------------- |
| 5432        | Postgres (single-db)             |
| 5433–5439   | Per-service Postgres (multi-db)  |
| 5440        | Ory Postgres (kratos/hydra/keto) |
| 4222 / 8222 | NATS client / monitor            |
| 6380        | Redis (`REDIS_URL`)              |
| 4433 / 4434 | Kratos public / admin            |
| 4444 / 4445 | Hydra public / admin             |
| 4466 / 4467 | Keto read / write                |
| 5555        | pgAdmin                          |
| 4317        | Alloy OTLP (obs profile only)    |
| 8333 / 8888 | SeaweedFS S3 / filer UI          |

## Object storage

`infra/docker/storage.compose.yaml` (included by `pnpm dev:infra*`). Env: `S3_ENDPOINT=http://127.0.0.1:8333`, `S3_BUCKET=attachments`, `S3_ACCESS_KEY` / `S3_SECRET_KEY` (defaults `seaweed`). `seaweedfs-init` CreateBuckets `S3_BUCKET` after S3 is healthy.

Upload “completed” but `NoSuchBucket` on read: broken bucket under `infra/data/docker/seaweedfs-data`. Recreate `attachments` (`DeleteBucket` + `CreateBucket`) or wipe that data dir and re-run `pnpm dev:infra` — confirm with the user first.

## Ory

Config: `infra/docker/identity/kratos/`, `identity/hydra/`, `authorization/keto/`. App URLs: `KRATOS_*_URL`, `HYDRA_*_URL`, `KETO_READ_URL` / `KETO_WRITE_URL` in root `.env`. `KRATOS_SECRETS_CIPHER` must be **32 chars**.

Keto datastore: role/DB `keto` on **ory-postgres** (`POSTGRES_KETO_PASSWORD`). Namespaces: OPL in `services/authorization-service/src/integrations/authorization/ory-keto/opl/namespaces.ts`. File-bind `keto.yaml` + mount OPL at `/etc/config/keto/opl` — do not nest that mount under a read-only bind of `authorization/keto`. `namespaces.location` points at that single `.ts` file. Class names are namespace strings (`identity`, `platform`, `tenant`, …). No parallel `id`/`name` list. Switching from a static list to OPL changes namespace IDs — recreate the `keto` database (or ory-postgres volume) before relying on existing tuples.

Init scripts apply only on **fresh** volumes. After openfga→keto, recreate ory-postgres (or create `keto` role/DB manually) if migrate fails.

Kratos mail: root `.env` only — never secrets in `kratos.yaml`.

- `BREVO_EMAIL` → `COURIER_SMTP_FROM_ADDRESS`
- `COURIER_SMTP_CONNECTION_URI` → Brevo SMTP relay
- `COURIER_SMTP_FROM_NAME` (optional, default `Pine`)
- Templates under `identity/kratos/courier-templates/` rewrite Kratos `VerificationURL` (`:4433/self-service/verification?...`) to `http://localhost:3000/verification?code=…&flow=…`

## Anti-patterns

- Ad-hoc compose flags instead of root `pnpm` scripts
- New compose basenames
- Per-package `.env` files
- Searching `infra/data/` for product code
- Volume/DB wipes without confirming with the user

## Done when

- Change uses existing `pnpm dev:infra*` overlays
- Root `.env.example` updated when ports/secrets/URLs change
- Ory/Keto mounts and `namespaces.location` still match
