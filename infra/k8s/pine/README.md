# pine (app namespace)

Apps, PostgresClusters, ExternalSecrets, and synced `*-secrets`. Gateway API objects stay in `pine-gateway`.

From `infra/`:

```powershell
kubectl apply -f ./k8s/pine/
```

`referencegrant-gateway.yaml` lets HTTPRoutes in `pine-gateway` target Services here. Apply after Envoy Gateway CRDs exist (`./k8s/envoy/`).
