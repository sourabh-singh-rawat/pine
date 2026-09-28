# Install k8s resources

## Dashboard

```powershell
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --create-namespace --namespace kubernetes-dashboard
kubectl apply -f ./k8s/dashboard
kubectl -n kubernetes-dashboard create token admin-user
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443
```

## Secrets

```powershell
kubectl apply -f ./k8s/secrets
```

## Postgres Operator

```powershell
helm install pgo ./k8s/pgo
```

## Install postgres for each service

```powershell
helm install attachment-postgres ./k8s/postgres --values ./k8s/postgres/values.yaml
helm install notification-postgres ./k8s/postgres --values ./k8s/postgres/values.yaml
helm install identity-postgres ./k8s/postgres --values ./k8s/postgres/values.yaml
helm install issue-tracker-postgres ./k8s/postgres --values ./k8s/postgres/values.yaml
```

## NATS (JetStream server + streams)

One-liners: [`infra/k8s/nats/README.md`](../../infra/k8s/nats/README.md) — Helm NATS + nack + Stream CRs (`kubectl apply -k ./k8s/nats/`). Laptop: `pnpm nats:streams`.

## Use google DNS

```powershell
kubectl edit configmap coredns -n kube-system

# Replace forward block with
forward . 8.8.8.8 8.8.4.4 {
    max_concurrent 1000
}

kubectl rollout restart deployment coredns -n kube-system
```
