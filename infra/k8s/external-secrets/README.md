# External Secrets Operator (OpenBao → Kubernetes)

Syncs OpenBao KV into Kubernetes Secrets for Deployment `envFrom` (same keys as local `.env`). Requires OpenBao seeded ([`../openbao/`](../openbao/)) and namespace `pine` ([`../pgo/`](../pgo/)).

From `infra/`:

```powershell
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm upgrade --install external-secrets external-secrets/external-secrets --namespace external-secrets --create-namespace
kubectl wait --for=condition=Available deployment -l app.kubernetes.io/name=external-secrets --namespace external-secrets --timeout=5m
kubectl wait --for=condition=Available deployment/external-secrets-webhook --namespace external-secrets --timeout=3m
kubectl get crd secretstores.external-secrets.io externalsecrets.external-secrets.io
kubectl apply -f ./k8s/pine/
kubectl create secret generic openbao-token --namespace pine --from-literal=token='<ROOT_TOKEN>' --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f ./k8s/external-secrets/ -n pine
kubectl get secretstores,externalsecrets,secrets -n pine
```

```powershell
kubectl get secret identity-secrets -n pine -o jsonpath='{.data.POSTGRES_IDENTITY_PASSWORD}' | ForEach-Object { [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($_)) }
kubectl describe secretstore openbao -n pine
kubectl describe externalsecret identity -n pine
```

Healthy: SecretStore `Valid`/`Ready`, ExternalSecrets `SecretSynced`.

`InvalidProviderConfig` / 403 on lookup-self → `openbao-token` still has literal `<ROOT_TOKEN>`. Re-apply with the live root token:

```powershell
kubectl create secret generic openbao-token --namespace pine --from-literal=token='<ROOT_TOKEN>' --dry-run=client -o yaml | kubectl apply -f -
```

| OpenBao path               | K8s Secret             | Env keys                                                         |
| -------------------------- | ---------------------- | ---------------------------------------------------------------- |
| `secret/pine/identity`     | `identity-secrets`     | `POSTGRES_IDENTITY_PASSWORD`                                     |
| `secret/pine/items`        | `items-secrets`        | `POSTGRES_ISSUES_PASSWORD`                                       |
| `secret/pine/attachment`   | `attachment-secrets`   | `POSTGRES_ATTACHMENT_PASSWORD`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| `secret/pine/platform`     | `platform-secrets`     | `POSTGRES_PLATFORM_PASSWORD`                                     |
| `secret/pine/notification` | `notification-secrets` | `POSTGRES_NOTIFICATION_PASSWORD`                                 |
| `secret/pine/audit`        | `audit-secrets`        | `POSTGRES_AUDIT_PASSWORD`                                        |

App wiring (later):

```yaml
envFrom:
  - secretRef:
      name: identity-secrets
```

Do not point apps at PGO `*-pguser-*` once ESO is healthy. Lab token auth is fine; prefer Kubernetes/AppRole before shared staging.

```powershell
kubectl delete -f ./k8s/external-secrets/ -n pine
kubectl delete secret openbao-token -n pine
helm uninstall external-secrets -n external-secrets
```
