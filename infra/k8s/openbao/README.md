# OpenBao

In-cluster secrets for Pine. Laptop uses root `.env` only. Chart: [OpenBao Helm](https://openbao.org/docs/platform/k8s/helm/) (standalone — lab/thin staging, not HA).

Host steps marked; everything else is inside the pod shell.

## Install (host)

```powershell
helm repo add openbao https://openbao.github.io/openbao-helm
helm repo update
helm upgrade --install openbao openbao/openbao --namespace openbao --create-namespace --set server.replicas=1
kubectl get pods -n openbao -l app.kubernetes.io/name=openbao
kubectl exec -it openbao-0 -n openbao -- sh
```

Pod often stays `0/1` until unsealed. If `bao` cannot connect: `export BAO_ADDR=http://127.0.0.1:8200`.

## Init / unseal / login (inside pod)

```sh
bao status
bao operator init -key-shares=1 -key-threshold=1
bao operator unseal '<UNSEAL_KEY>'
bao status
bao login '<ROOT_TOKEN>'
bao secrets enable -path=secret kv-v2
```

Save every Unseal Key and the Initial Root Token outside the cluster. Do not re-init. Default Shamir: `bao operator init` (5 shares / threshold 3). After every pod restart: unseal again (init is not repeated).

## Seed — order matters

Do **not** invent Postgres passwords before PGO ([`../pgo/`](../pgo/)). Flow: PGO Secrets → copy into OpenBao once → ESO ([`../external-secrets/`](../external-secrets/)) → `*-secrets` → Deployment `envFrom`.

Non-DB (safe before PGO):

```sh
bao kv put secret/pine/attachment s3_access_key=seaweed s3_secret_key=seaweed
bao kv get secret/pine/attachment
```

### After PGO — copy DB passwords (host, once)

Set token once, then each line (decode PGO Secret → `bao kv put` via stdin JSON):

```powershell
$BAO_TOKEN='<ROOT_TOKEN>'
$pw=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((kubectl get secret identity-pguser-identity -n pine -o jsonpath='{.data.password}'))); (@{postgres_identity_password=$pw} | ConvertTo-Json -Compress) | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 "BAO_TOKEN=$BAO_TOKEN" bao kv put secret/pine/identity -
$pw=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((kubectl get secret items-pguser-issues -n pine -o jsonpath='{.data.password}'))); (@{postgres_issues_password=$pw} | ConvertTo-Json -Compress) | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 "BAO_TOKEN=$BAO_TOKEN" bao kv put secret/pine/items -
$pw=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((kubectl get secret attachment-pguser-attachment -n pine -o jsonpath='{.data.password}'))); (@{postgres_attachment_password=$pw;s3_access_key='seaweed';s3_secret_key='seaweed'} | ConvertTo-Json -Compress) | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 "BAO_TOKEN=$BAO_TOKEN" bao kv put secret/pine/attachment -
$pw=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((kubectl get secret platform-pguser-platform -n pine -o jsonpath='{.data.password}'))); (@{postgres_platform_password=$pw} | ConvertTo-Json -Compress) | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 "BAO_TOKEN=$BAO_TOKEN" bao kv put secret/pine/platform -
$pw=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((kubectl get secret notification-pguser-notification -n pine -o jsonpath='{.data.password}'))); (@{postgres_notification_password=$pw} | ConvertTo-Json -Compress) | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 "BAO_TOKEN=$BAO_TOKEN" bao kv put secret/pine/notification -
$pw=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((kubectl get secret audit-pguser-audit -n pine -o jsonpath='{.data.password}'))); (@{postgres_audit_password=$pw} | ConvertTo-Json -Compress) | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 "BAO_TOKEN=$BAO_TOKEN" bao kv put secret/pine/audit -
```

```sh
bao kv get secret/pine/identity
bao kv list secret/pine
```

| Path                       | Keys                                                             |
| -------------------------- | ---------------------------------------------------------------- |
| `secret/pine/identity`     | `postgres_identity_password`                                     |
| `secret/pine/items`        | `postgres_issues_password`                                       |
| `secret/pine/attachment`   | `postgres_attachment_password`, `s3_access_key`, `s3_secret_key` |
| `secret/pine/platform`     | `postgres_platform_password`                                     |
| `secret/pine/notification` | `postgres_notification_password`                                 |
| `secret/pine/audit`        | `postgres_audit_password`                                        |

## Misc (inside pod)

```sh
bao operator seal
bao secrets list
bao auth list
bao kv metadata get secret/pine/identity
bao kv metadata delete -force secret/pine/identity
```

## After restart (inside pod)

```sh
bao operator unseal '<UNSEAL_KEY>'
bao login '<ROOT_TOKEN>'
```

## Uninstall (host, destructive)

```powershell
helm uninstall openbao -n openbao
```

Next: [`../external-secrets/README.md`](../external-secrets/README.md) — OpenBao → ESO → `identity-secrets` … → `envFrom`.
