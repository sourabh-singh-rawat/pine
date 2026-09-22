# Envoy Gateway

Self-hosted Gateway API front door for Pine (not GKE Gateway, not community ingress-nginx).

## Install

From `infra/`:

```powershell
helm upgrade --install eg oci://docker.io/envoyproxy/gateway-helm `
  --version v1.9.1 `
  -n envoy-gateway-system `
  --create-namespace

kubectl wait --timeout=5m -n envoy-gateway-system deployment/envoy-gateway --for=condition=Available

kubectl apply -f ./k8s/envoy-gateway/gateway.yaml
kubectl apply -f ./k8s/envoy-gateway/httproutes.yaml
```

## Manifests

- `gateway.yaml` — Namespace `pine-gateway`, GatewayClass `eg`, Gateway `pine` (HTTP :80)
- `httproutes.yaml` — path routes into the gateways (Services must exist in `pine-gateway`):
  - `/api` → `api-gateway:4000` (prefix stripped)
  - `/data` → `data-gateway:4001` (prefix stripped)

Clients should use base URLs like `https://<gateway-host>/api` and `https://<gateway-host>/data`. Until those Services are deployed, the routes attach but backends return errors.
