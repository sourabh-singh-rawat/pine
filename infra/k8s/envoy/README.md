# Envoy Gateway

Self-hosted Gateway API front door (not GKE Gateway, not community ingress-nginx).

From `infra/`:

```powershell
helm upgrade --install eg oci://docker.io/envoyproxy/gateway-helm --version v1.9.1 -n envoy-gateway-system --create-namespace
kubectl wait --timeout=5m -n envoy-gateway-system deployment/envoy-gateway --for=condition=Available
kubectl apply -f ./k8s/envoy/gateway.yaml
kubectl apply -f ./k8s/pine/
kubectl apply -f ./k8s/envoy/httproutes.yaml
```

- `gateway.yaml` — Namespace `pine-gateway`, GatewayClass `eg`, Gateway `pine` (HTTP :80)
- `../pine/` — Namespace `pine` + ReferenceGrant so routes may target Services there
- `httproutes.yaml` — `/api` → `api-gateway.pine:4000`, `/data` → `data-gateway.pine:4001` (prefix stripped)

Client bases: `https://<gateway-host>/api` and `https://<gateway-host>/data`. Backends error until those Services exist in `pine`.
