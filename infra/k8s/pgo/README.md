# PGO (Crunchy Postgres Operator)

Operator + per-app `PostgresCluster` YAMLs in this folder. Laptop `pnpm dev` still uses Compose Postgres from root `.env`.

Do **not** apply clusters before the operator (CRDs must exist). Clusters live in `pine` ([`../pine/`](../pine/)). From `infra/`:

```powershell
helm install pgo oci://registry.developers.crunchydata.com/crunchydata/pgo --namespace postgres-operator --create-namespace
kubectl wait --for=condition=Available deployment -l app.kubernetes.io/name=pgo --namespace postgres-operator --timeout=5m
kubectl get crd postgresclusters.postgres-operator.crunchydata.com
kubectl apply -f ./k8s/pine/
kubectl apply -f ./k8s/pgo/ -n pine
kubectl get postgresclusters -n pine
```

```powershell
helm upgrade --install pgo oci://registry.developers.crunchydata.com/crunchydata/pgo --namespace postgres-operator --create-namespace
helm show values oci://registry.developers.crunchydata.com/crunchydata/pgo
```

```powershell
kubectl get postgresclusters -n pine
kubectl get pods -n pine -l postgres-operator.crunchydata.com/role=master
kubectl get secrets -n pine -l postgres-operator.crunchydata.com/role=pguser
```

PGO writes `{cluster}-pguser-{user}` Secrets. Do not invent passwords before clusters exist.

| Cluster        | User / database | Secret                             |
| -------------- | --------------- | ---------------------------------- |
| `identity`     | `identity`      | `identity-pguser-identity`         |
| `items`        | `issues`        | `items-pguser-issues`              |
| `attachment`   | `attachment`    | `attachment-pguser-attachment`     |
| `platform`     | `platform`      | `platform-pguser-platform`         |
| `notification` | `notification`  | `notification-pguser-notification` |
| `audit`        | `audit`         | `audit-pguser-audit`               |

`items` keeps user/db `issues` for `POSTGRES_ISSUES_PASSWORD` / OpenBao `postgres_issues_password`.

Copy passwords into OpenBao once: [`../openbao/README.md`](../openbao/README.md). Then ESO: [`../external-secrets/README.md`](../external-secrets/README.md). Deployments `envFrom` `*-secrets` only.

Defaults: Postgres 18, `1Gi` data + `1Gi` backup, single instance, API `v1` (CPK 6.x). Use `v1beta1` only on PGO 5.x.

```powershell
kubectl delete -f ./k8s/pgo/ -n pine
helm uninstall pgo -n postgres-operator
```

PVCs may remain. Helm leaves CRDs; delete them only for a full wipe.
