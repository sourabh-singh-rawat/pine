# NATS (JetStream)

Server Helm values + Stream CRs in this folder. Laptop `pnpm dev` uses Compose NATS (`nats://localhost:4222`) and `pnpm nats:streams`. Chart: [nats-io/k8s](https://github.com/nats-io/k8s/tree/main/helm/charts/nats). Apps connect only; they do not create streams. Durable consumer handlers stay in app code.

Single replica, JetStream PVC `1Gi` — lab/thin staging. Stream names match `@pine/events` `Streams`.

From `infra/`:

```powershell
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo update
helm upgrade --install nats nats/nats --namespace nats --create-namespace --values ./k8s/nats/values.yaml
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=nats --namespace nats --timeout=5m
kubectl apply -f https://github.com/nats-io/nack/releases/latest/download/crds.yml
helm upgrade --install nack nats/nack --namespace nats --set jetstream.nats.url=nats://nats.nats.svc:4222
kubectl wait --for=condition=Available deployment/nack --namespace nats --timeout=5m
kubectl apply -k ./k8s/nats/
kubectl get pods,svc,pvc,streams -n nats
```

`kubectl apply -k` applies the Stream CRs from `kustomization.yaml` (`values.yaml` stays Helm-only).

In-cluster URL for apps in other namespaces: `nats://nats.nats.svc:4222`. Same namespace: `nats://nats:4222`.

| Stream          | Subjects          |
| --------------- | ----------------- |
| `attachment`    | `attachment.>`    |
| `authorization` | `authorization.>` |
| `identity`      | `identity.>`      |
| `items`         | `items.>`         |
| `platform`      | `platform.>`      |

No `notification` stream — notification-service consumes `identity` (and others) only.

## Laptop (Compose)

```powershell
pnpm nats:streams
nats stream ls --server nats://127.0.0.1:4222
```

Compose JetStream under `/tmp` is wiped on container recreate; re-run `pnpm nats:streams`.

```powershell
helm show values nats/nats
kubectl port-forward -n nats svc/nats 4222:4222
```

```powershell
kubectl delete -k ./k8s/nats/
helm uninstall nack -n nats
helm uninstall nats -n nats
```


PVCs may remain.
