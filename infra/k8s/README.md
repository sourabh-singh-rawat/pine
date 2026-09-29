# Pine Kubernetes

Single install/runbook for cluster deploy. Day-to-day coding stays on Compose + `pnpm dev` (`infra/docker`). Grow this file as we learn; do not add per-folder READMEs.

**Shell: Linux bash.** Commands assume cwd `infra/` unless noted (except host bootstrap). Agent playbook: [`.grok/skills/k8s/SKILL.md`](../../.grok/skills/k8s/SKILL.md).

## Layout

```text
infra/k8s/
  pine/              Namespace pine + ReferenceGrant
  envoy/             Gateway + HTTPRoutes
  openbao/           (Helm only — no apply YAMLs)
  pgo/               PostgresCluster YAMLs (incl. ory)
  external-secrets/  SecretStore + ExternalSecrets
  nats/              Helm values + Stream CRs
  seaweed/           All-in-one S3
  kratos/ hydra/ keto/   Ory Helm values
  microservice/      App chart + per-service values + ocir overlay
```

## Install order

0. OCI VM + k3s (host)
1. Envoy Gateway + pine namespace
2. OpenBao (init / unseal / seed)
3. PGO operator + PostgresClusters
4. OpenBao DB password seed + External Secrets
5. NATS + nack + streams
6. SeaweedFS
7. Ory (Kratos / Hydra / Keto)
8. OCIR images + microservice Helm

---

## 0. OCI VM + k3s

Solo / Always Free path: one **Ampere A1** VM (`VM.Standard.A1.Flex`, up to **2 OCPU / 12 GB**), **Oracle Linux 9** (aarch64), single-node **k3s**. Then run sections 1–8 against that cluster. Images must be **linux/arm64** (OCIR push with `--platform linux/arm64` when building from an amd64 laptop).

### Create the VM (OCI Console)

1. Compute → Create instance.
2. Image: **Oracle Linux 9** (aarch64 / Always Free eligible).
3. Shape: **VM.Standard.A1.Flex** — 2 OCPU, 12 GB (or whatever fits your Always Free remaining quota).
4. Networking: public subnet + assign public IP (lab). Add SSH key.
5. Boot volume: stay within Always Free block storage (often ~50–100 GB boot is enough to start).

### Security list / NSG (VCN)

Allow inbound to the instance (source = your IP for admin; `0.0.0.0/0` only if you accept the risk):

| Port | Why |
| ---- | --- |
| TCP 22 | SSH |
| TCP 6443 | Kubernetes API (kubectl from laptop) |
| TCP 80 | HTTP Gateway (Envoy) |
| TCP 443 | HTTPS later |

Pod/service overlays (`10.42.0.0/16`, `10.43.0.0/16`) stay on-node; no need to open them on the VCN for a single node.

### Host prep (SSH as `opc` on Oracle Linux 9)

```bash
sudo dnf -y update
sudo dnf -y install curl tar
sudo swapoff -a
sudo sed -i '/ swap /s/^/#/' /etc/fstab
sudo systemctl disable --now firewalld
sudo modprobe br_netfilter
echo br_netfilter | sudo tee /etc/modules-load.d/br_netfilter.conf
```

If you keep `firewalld` instead of disabling it:

```bash
sudo firewall-cmd --permanent --add-port=6443/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=10250/tcp
sudo firewall-cmd --permanent --zone=trusted --add-source=10.42.0.0/16
sudo firewall-cmd --permanent --zone=trusted --add-source=10.43.0.0/16
sudo firewall-cmd --reload
```

### Install k3s

Disable Traefik so Pine’s Envoy Gateway owns ingress (section 1). Use the instance **public IP** (or DNS) as a TLS SAN so laptop kubectl works.

```bash
# Set to the instance public IP from the OCI Console (or: ip -4 addr show)
PUBLIC_IP=x.x.x.x
curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644 --disable traefik --tls-san "$PUBLIC_IP"
sudo systemctl enable --now k3s
sudo kubectl get nodes
sudo kubectl get pods -A
```

Kubeconfig on the node: `/etc/rancher/k3s/k3s.yaml` (server is `127.0.0.1`). For your laptop, copy and replace the server address:

```bash
mkdir -p ~/.kube
sudo cat /etc/rancher/k3s/k3s.yaml | sed "s/127.0.0.1/$PUBLIC_IP/g" > ~/.kube/pine-k3s.yaml
chmod 600 ~/.kube/pine-k3s.yaml
# on laptop after scp:
# export KUBECONFIG=~/.kube/pine-k3s.yaml
# kubectl get nodes
```

### Helm + tools on the node (or laptop)

```bash
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
kubectl version --client
```

Optional UI from your laptop: Lens / OpenLens / Freelens with `pine-k3s.yaml`. Do not install Rancher on this Always Free box.

### Then

Clone the Pine repo onto the VM (or run Helm from your laptop with `KUBECONFIG` pointed at the cluster). From `infra/`, continue at **section 1**.

---

## 1. Envoy Gateway + pine

```bash
helm upgrade --install eg oci://docker.io/envoyproxy/gateway-helm --version v1.9.1 -n envoy-gateway-system --create-namespace
kubectl wait --timeout=5m -n envoy-gateway-system deployment/envoy-gateway --for=condition=Available
kubectl apply -f ./k8s/envoy/gateway.yaml
kubectl apply -f ./k8s/pine/
kubectl apply -f ./k8s/envoy/httproutes.yaml
```

- Gateway `pine` in `pine-gateway` (HTTP :80), class `eg`
- `/api` → `api-gateway.pine:4000`, `/data` → `data-gateway.pine:4001` (prefix stripped)
- ReferenceGrant lets routes target Services in `pine`

---

## 2. OpenBao

Standalone lab chart (not HA). Laptop secrets stay in root `.env`.

```bash
helm repo add openbao https://openbao.github.io/openbao-helm
helm repo update
helm upgrade --install openbao openbao/openbao --namespace openbao --create-namespace --set server.replicas=1
kubectl exec -it openbao-0 -n openbao -- sh
```

Inside pod (`export BAO_ADDR=http://127.0.0.1:8200` if needed):

```sh
bao status
bao operator init -key-shares=1 -key-threshold=1
bao operator unseal '<UNSEAL_KEY>'
bao login '<ROOT_TOKEN>'
bao secrets enable -path=secret kv-v2
```

Save unseal key + root token outside the cluster. After every pod restart: unseal again (do not re-init).

Non-DB seed (safe before PGO):

```sh
bao kv put secret/pine/attachment s3_access_key=seaweed s3_secret_key=seaweed
```

DB password seed is **after** PGO (section 4).

---

## 3. PGO (Postgres)

```bash
helm upgrade --install pgo oci://registry.developers.crunchydata.com/crunchydata/pgo --namespace postgres-operator --create-namespace
kubectl wait --for=condition=Available deployment -l app.kubernetes.io/name=pgo --namespace postgres-operator --timeout=5m
kubectl apply -f ./k8s/pine/
kubectl apply -f ./k8s/pgo/ -n pine
kubectl get postgresclusters -n pine
```

| Cluster | User / DB | Secret |
| ------- | --------- | ------ |
| `identity` | `identity` | `identity-pguser-identity` |
| `items` | `issues` | `items-pguser-issues` |
| `attachment` | `attachment` | `attachment-pguser-attachment` |
| `platform` | `platform` | `platform-pguser-platform` |
| `notification` | `notification` | `notification-pguser-notification` |
| `audit` | `audit` | `audit-pguser-audit` |
| `ory` | `kratos`, `hydra`, `keto` | `ory-pguser-kratos`, `ory-pguser-hydra`, `ory-pguser-keto` |

`items` keeps user/db `issues` for `POSTGRES_ISSUES_PASSWORD`. Defaults: Postgres 18, `1Gi` data + backup, single instance.

### Ory `public` schema grants (Postgres 15+)

Before Kratos/Hydra/Keto migrate:

```bash
pod=$(kubectl get pods -n pine -l postgres-operator.crunchydata.com/cluster=ory,postgres-operator.crunchydata.com/role=master -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n pine "$pod" -c database -- psql -U postgres -v ON_ERROR_STOP=1 -c "ALTER DATABASE kratos OWNER TO kratos; ALTER DATABASE hydra OWNER TO hydra; ALTER DATABASE keto OWNER TO keto;"
for db in kratos hydra keto; do kubectl exec -n pine "$pod" -c database -- psql -U postgres -d "$db" -v ON_ERROR_STOP=1 -c "GRANT ALL ON SCHEMA public TO ${db}; ALTER SCHEMA public OWNER TO ${db};"; done
```

---

## 4. Seed OpenBao + External Secrets

### Copy PGO passwords into OpenBao (host, once)

Needs `jq` on the host. Set token once, then each line:

```bash
export BAO_TOKEN='<ROOT_TOKEN>'
pw=$(kubectl get secret identity-pguser-identity -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_identity_password:$pw}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/identity -
pw=$(kubectl get secret items-pguser-issues -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_issues_password:$pw}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/items -
pw=$(kubectl get secret attachment-pguser-attachment -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_attachment_password:$pw,s3_access_key:"seaweed",s3_secret_key:"seaweed"}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/attachment -
pw=$(kubectl get secret platform-pguser-platform -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_platform_password:$pw}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/platform -
pw=$(kubectl get secret notification-pguser-notification -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_notification_password:$pw}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/notification -
pw=$(kubectl get secret audit-pguser-audit -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_audit_password:$pw}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/audit -
```

| OpenBao path | K8s Secret (via ESO) | Keys today |
| ------------ | -------------------- | ---------- |
| `secret/pine/identity` | `identity-secrets` | `POSTGRES_IDENTITY_PASSWORD` |
| `secret/pine/items` | `items-secrets` | `POSTGRES_ISSUES_PASSWORD` |
| `secret/pine/attachment` | `attachment-secrets` | `POSTGRES_ATTACHMENT_PASSWORD`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| `secret/pine/platform` | `platform-secrets` | `POSTGRES_PLATFORM_PASSWORD` |
| `secret/pine/notification` | `notification-secrets` | `POSTGRES_NOTIFICATION_PASSWORD` |
| `secret/pine/audit` | `audit-secrets` | `POSTGRES_AUDIT_PASSWORD` |

Apps also need full `*_DATABASE_URL` (and related) in those Secrets before pods stay healthy — seed those keys in OpenBao/ESO as we wire them.

### External Secrets Operator

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm upgrade --install external-secrets external-secrets/external-secrets --namespace external-secrets --create-namespace
kubectl wait --for=condition=Available deployment -l app.kubernetes.io/name=external-secrets --namespace external-secrets --timeout=5m
kubectl create secret generic openbao-token --namespace pine --from-literal=token='<ROOT_TOKEN>' --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f ./k8s/external-secrets/ -n pine
kubectl get secretstores,externalsecrets,secrets -n pine
```

Healthy: SecretStore Ready, ExternalSecrets `SecretSynced`. Sealed OpenBao → `InvalidProviderConfig`. Wrong token → re-apply `openbao-token`.

---

## 5. NATS (JetStream)

```bash
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo update
helm upgrade --install nats nats/nats --namespace nats --create-namespace --values ./k8s/nats/values.yaml
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=nats --namespace nats --timeout=5m
kubectl apply -f https://github.com/nats-io/nack/releases/latest/download/crds.yml
helm upgrade --install nack nats/nack --namespace nats --set jetstream.nats.url=nats://nats.nats.svc:4222
kubectl wait --for=condition=Available deployment/nack --namespace nats --timeout=5m
kubectl apply -k ./k8s/nats/
```

In-cluster URL: `nats://nats.nats.svc:4222`. Streams: `attachment`, `authorization`, `identity`, `items`, `platform`. Apps do not create streams. Laptop Compose: `pnpm nats:streams`.

---

## 6. SeaweedFS

```bash
kubectl apply -f ./k8s/seaweed/statefulset.yaml -n pine
kubectl apply -f ./k8s/seaweed/service.yaml -n pine
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=seaweedfs -n pine --timeout=5m
kubectl delete job seaweedfs-bucket-init -n pine --ignore-not-found
kubectl apply -f ./k8s/seaweed/bucket-init.yaml -n pine
kubectl wait --for=condition=complete job/seaweedfs-bucket-init -n pine --timeout=5m
```

S3: `http://seaweedfs.pine.svc:8333`, bucket `attachments`.

---

## 7. Ory (Kratos / Hydra / Keto)

Charts `ory/*` `0.64.0`, app `v26.2.0` (Compose parity). Requires `ory` Postgres + schema grants (section 3).

### DSN secrets + Keto OPL

```bash
ory_dsn() { uri=$(kubectl get secret "ory-pguser-$1" -n pine -o jsonpath='{.data.uri}' | base64 -d); case "$uri" in *\?*) dsn="${uri}&sslmode=require" ;; *) dsn="${uri}?sslmode=require" ;; esac; kubectl create secret generic "$2" --namespace pine --from-literal=dsn="$dsn" --dry-run=client -o yaml | kubectl apply -f -; }
ory_dsn kratos kratos-dsn
ory_dsn hydra hydra-dsn
ory_dsn keto keto-dsn
kubectl create configmap keto-opl --namespace pine --from-file=namespaces.ts=../services/authorization-service/src/integrations/authorization/ory-keto/opl/namespaces.ts --dry-run=client -o yaml | kubectl apply -f -
```

Re-apply `keto-opl` after OPL changes, then `kubectl rollout restart deployment/keto -n pine`.

### Helm install

```bash
helm repo add ory https://k8s.ory.sh/helm/charts
helm repo update
helm upgrade --install kratos ory/kratos --namespace pine --version 0.64.0 --values ./k8s/kratos/values.yaml --timeout 10m
helm upgrade --install hydra ory/hydra --namespace pine --version 0.64.0 --values ./k8s/hydra/values.yaml --timeout 10m
helm upgrade --install keto ory/keto --namespace pine --version 0.64.0 --values ./k8s/keto/values.yaml --timeout 10m
```

| Service | In-cluster URLs |
| ------- | --------------- |
| Kratos | `http://kratos-public.pine.svc:4433`, `http://kratos-admin.pine.svc:4434` |
| Hydra | `http://hydra-public.pine.svc:4444`, `http://hydra-admin.pine.svc:4445` |
| Keto | `http://keto-read.pine.svc:4466`, `http://keto-write.pine.svc:4467` |

Lab cookie/cipher/system secrets in values are placeholders. Courier SMTP is a stub.

---

## 8. App images (OCIR) + microservices

Private registry for remote clusters (Oracle VM / OKE). Not Docker Desktop `:local` / `Never`.

### Push images (repo root)

```bash
docker login iad.ocir.io
# username: <namespace>/<oci-user-or-email>  password: Auth Token
export OCIR_REGION_KEY=iad
export OCIR_NAMESPACE='<your-namespace>'
export OCIR_IMAGE_TAG=0.1.0
pnpm images:push:ocir
# one service: pnpm images:push:ocir -- --service identity
```

Script: `tools/scripts/oci/push-images.sh`.

### Pull secret + overlay

Edit `microservice/ocir.values.yaml` → `image.registry: iad.ocir.io/<namespace>`.

```bash
kubectl create secret docker-registry ocir-pull -n pine --docker-server=iad.ocir.io --docker-username='<namespace>/<oci-user-or-email>' --docker-password='<auth-token>' --docker-email='<email>'
```

### TLS secrets (lab)

After `pnpm tls:generate` (repo root), create per-service Secrets matching `tls.secretName` in each values file (`identity-tls`, `items-tls`, …) with `tls.key`, `tls.crt`, `ca.crt`.

### Helm install apps

Thin chart: `microservice/` + `*.values.yaml`. Do not fork the chart. Chart supports `image.registry` and `imagePullSecrets`.

```bash
OCIR_VALUES=./k8s/microservice/ocir.values.yaml
helm upgrade --install identity ./k8s/microservice -n pine -f ./k8s/microservice/identity.values.yaml -f "$OCIR_VALUES"
helm upgrade --install items ./k8s/microservice -n pine -f ./k8s/microservice/items.values.yaml -f "$OCIR_VALUES"
helm upgrade --install attachment ./k8s/microservice -n pine -f ./k8s/microservice/attachment.values.yaml -f "$OCIR_VALUES"
helm upgrade --install platform ./k8s/microservice -n pine -f ./k8s/microservice/platform.values.yaml -f "$OCIR_VALUES"
helm upgrade --install authorization ./k8s/microservice -n pine -f ./k8s/microservice/authorization.values.yaml -f "$OCIR_VALUES"
helm upgrade --install audit ./k8s/microservice -n pine -f ./k8s/microservice/audit.values.yaml -f "$OCIR_VALUES"
helm upgrade --install notification ./k8s/microservice -n pine -f ./k8s/microservice/notification.values.yaml -f "$OCIR_VALUES"
helm upgrade --install attachment-scanner ./k8s/microservice -n pine -f ./k8s/microservice/attachment-scanner.values.yaml -f "$OCIR_VALUES"
helm upgrade --install attachment-image-processing ./k8s/microservice -n pine -f ./k8s/microservice/attachment-image-processing.values.yaml -f "$OCIR_VALUES"
helm upgrade --install api-gateway ./k8s/microservice -n pine -f ./k8s/microservice/api-gateway.values.yaml -f "$OCIR_VALUES"
helm upgrade --install data-gateway ./k8s/microservice -n pine -f ./k8s/microservice/data-gateway.values.yaml -f "$OCIR_VALUES"
kubectl get deploy,svc,pods -n pine
```

---

## Namespaces

| Namespace | Owns |
| --------- | ---- |
| `pine` | Apps, PostgresClusters, ESO objects, Seaweed, Ory |
| `pine-gateway` | Gateway + HTTPRoutes |
| `envoy-gateway-system` | Envoy Gateway |
| `openbao` | OpenBao |
| `postgres-operator` | PGO |
| `external-secrets` | ESO |
| `nats` | NATS + nack + streams |

---

## Checks

```bash
kubectl get gateway,httproute -A
kubectl get postgresclusters -n pine
kubectl get secretstores,externalsecrets -n pine
kubectl get pods,svc,streams -n nats
kubectl get pods -n pine -l 'app.kubernetes.io/name in (seaweedfs,kratos,hydra,keto)'
kubectl get deploy,pods -n pine
helm template identity ./k8s/microservice -n pine -f ./k8s/microservice/identity.values.yaml -f ./k8s/microservice/ocir.values.yaml --set image.registry=iad.ocir.io/example
```

---

## Notes / open gaps

- Fresh cluster for staging/prod; do not migrate Docker Desktop state.
- Seed full `*_DATABASE_URL` into OpenBao/ESO before expecting app pods to stay up.
- ClamAV / web apps not on this chart path yet.
- Lab OpenBao uses root token; prefer AppRole/K8s auth before shared staging.
- Destructive uninstalls (delete releases, wipe PVCs) → confirm first.
