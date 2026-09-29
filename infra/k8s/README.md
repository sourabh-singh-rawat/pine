# Pine Kubernetes

Single install/runbook for cluster deploy. **Re-run the same steps on every new cluster** — set the variables in section 0 once per host, then walk 0→8. Day-to-day coding stays on Compose + `pnpm dev` (`infra/docker`). Grow this file as we learn; do not add per-folder READMEs.

**Shell: Linux bash.** Commands assume cwd `infra/` unless noted (except host bootstrap). Point `KUBECONFIG` at the cluster you mean before sections 1–8. Agent playbook: [`.grok/skills/k8s/SKILL.md`](../../.grok/skills/k8s/SKILL.md).

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

Same recipe for every cluster (lab VM, second Always Free box, future staging host):

0. OCI VM + k3s (host) — once per VM
1. Envoy Gateway + pine namespace
2. OpenBao (init / unseal / seed) — init once per cluster; unseal after every OpenBao restart
3. PGO operator + PostgresClusters
4. OpenBao DB password seed + External Secrets
5. NATS + nack + streams
6. SeaweedFS
7. Ory (Kratos / Hydra / Keto)
8. OCIR images + microservice Helm

Sections 1–8 use `helm upgrade --install` / `kubectl apply` and are safe to re-run against an existing cluster (fix or continue). Section 0 is host bootstrap: skip k3s install if the node is already Ready; do a full new section 0 only on a new VM.

---

## 0. OCI VM + k3s

Solo / Always Free path: one **Ampere A1** VM (`VM.Standard.A1.Flex`, up to **2 OCPU / 12 GB**), **Oracle Linux 9** (aarch64), single-node **k3s**. Images must be **linux/arm64** (OCIR push with `--platform linux/arm64` when building from an amd64 laptop).

### Enter the host as root

SSH as `opc`, then:

```bash
sudo -i
```

Section 0 host commands assume this root login shell (`sudo -i`). That is fine for VM prep, firewalld, k3s, and on-box Helm. Day-to-day cluster ops from a **laptop** use a normal user + `KUBECONFIG` (no root on the laptop).

### Cluster variables (set every install)

Copy this block at the start of each new cluster (after `sudo -i`). Use a distinct `CLUSTER_NAME` per VM so kubeconfig files do not overwrite each other on your laptop.

```bash
# Unique name for this cluster/VM (OCI display name + local kubeconfig stem)
export CLUSTER_NAME=pine-cluster-main

# Public IP from OCI Console (or: curl -sf -4 ifconfig.me)
export PUBLIC_IP=x.x.x.x

# Where this shell finds k3s/kubectl/helm (OL9 root PATH often omits /usr/local/bin)
export PATH="/usr/local/bin:$PATH"

# On the node after k3s is up — or on the laptop after scp:
# export KUBECONFIG="$HOME/.kube/${CLUSTER_NAME}.yaml"
```

Persist PATH for root on the node:

```bash
grep -q '/usr/local/bin' ~/.bashrc || echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
```

### Create the VM (OCI Console)

1. Compute → Create instance. **Name** = `CLUSTER_NAME` (e.g. `pine-cluster-main`).
2. Image: **Oracle Linux 9** (aarch64 / Always Free eligible).
3. Shape: **VM.Standard.A1.Flex** — 2 OCPU, 12 GB (or whatever fits Always Free remaining quota).
4. Networking: public subnet + assign public IP (lab). Add SSH key.
5. Boot volume: stay within Always Free block storage (often ~50–100 GB boot is enough to start).
6. Set `PUBLIC_IP` from the instance detail page after create.

Repeat this for each new cluster (new VM → new `CLUSTER_NAME` / `PUBLIC_IP` → same commands below).

### Security list / NSG (VCN)

Allow inbound to the instance (source = your IP for admin; `0.0.0.0/0` only if you accept the risk). Reuse the same VCN rules for every lab VM in that subnet, or attach the same NSG.

| Port     | Why                                  |
| -------- | ------------------------------------ |
| TCP 22   | SSH                                  |
| TCP 6443 | Kubernetes API (kubectl from laptop) |
| TCP 80   | HTTP Gateway (Envoy)                 |
| TCP 443  | HTTPS later                          |

Pod/service overlays (`10.42.0.0/16`, `10.43.0.0/16`) stay on-node; no need to open them on the VCN for a single node.

### Host prep (as root after `sudo -i`)

Idempotent — safe on a fresh image or a re-run:

```bash
dnf -y update
dnf -y install curl tar jq
swapoff -a
sed -i '/ swap /s/^/#/' /etc/fstab
modprobe br_netfilter
echo br_netfilter | tee /etc/modules-load.d/br_netfilter.conf
```

Keep `firewalld` on and open what k3s + Envoy need (pod/service CIDRs trusted on-node). Idempotent:

```bash
systemctl enable --now firewalld
firewall-cmd --permanent --add-port=6443/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=10250/tcp
firewall-cmd --permanent --zone=trusted --add-source=10.42.0.0/16
firewall-cmd --permanent --zone=trusted --add-source=10.43.0.0/16
firewall-cmd --reload
firewall-cmd --list-all
```

### Install k3s

Disable Traefik so Pine’s Envoy Gateway owns ingress (section 1). `--tls-san` must include this cluster’s `PUBLIC_IP` (or DNS) so laptop kubectl works.

**Only on a host that does not already have k3s.** If `systemctl is-active k3s` is `active` and `k3s kubectl get nodes` shows Ready, skip to kubeconfig / Helm.

```bash
# Requires CLUSTER_NAME, PUBLIC_IP, PATH from above
test -n "$PUBLIC_IP" && test "$PUBLIC_IP" != "x.x.x.x"

curl -sfL https://get.k3s.io | sh -s - \
  --write-kubeconfig-mode 644 \
  --disable traefik \
  --tls-san "$PUBLIC_IP"

systemctl enable --now k3s
# Prefer full path if PATH is wrong: /usr/local/bin/k3s kubectl …
k3s kubectl get nodes
k3s kubectl get pods -A
```

Expect: one Ready node; `coredns`, `local-path-provisioner`, `metrics-server` Running; **no** Traefik pods.

### Kubeconfig (node + laptop)

On the node as root (`sudo -i`):

```bash
mkdir -p ~/.kube
cp /etc/rancher/k3s/k3s.yaml "$HOME/.kube/${CLUSTER_NAME}.yaml"
chmod 600 "$HOME/.kube/${CLUSTER_NAME}.yaml"
# API listens on loopback in the file — fine on-node:
export KUBECONFIG="$HOME/.kube/${CLUSTER_NAME}.yaml"
kubectl get nodes
```

For the **laptop**, rewrite the server address to `PUBLIC_IP`, then `scp`:

```bash
# on the node:
sed "s/127.0.0.1/${PUBLIC_IP}/g" /etc/rancher/k3s/k3s.yaml > "/tmp/${CLUSTER_NAME}.yaml"
chmod 600 "/tmp/${CLUSTER_NAME}.yaml"
# scp /tmp/${CLUSTER_NAME}.yaml laptop:~/.kube/${CLUSTER_NAME}.yaml

# on the laptop:
# export KUBECONFIG="$HOME/.kube/${CLUSTER_NAME}.yaml"
# kubectl get nodes
```

Switch clusters later with `export KUBECONFIG=$HOME/.kube/<other-cluster>.yaml` (or Lens profiles). Do not install Rancher on an Always Free box; use Lens / OpenLens / Freelens on the laptop.

### Helm + tools (node or laptop)

Idempotent installer:

```bash
export PATH="/usr/local/bin:$PATH"
command -v helm >/dev/null || curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
kubectl version --client
```

### New cluster checklist

| Step         | Action                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| New VM       | New OCI instance + `CLUSTER_NAME` / `PUBLIC_IP`                                                                       |
| Section 0    | Host prep → firewalld → k3s → kubeconfig → Helm                                                                       |
| Sections 1–8 | Same commands; `export KUBECONFIG=…` first                                                                            |
| Tear down    | Delete the OCI instance (or `k3s-uninstall.sh`); keep laptop `~/.kube/${CLUSTER_NAME}.yaml` only if you still need it |

### Then

Clone or pull Pine on the VM, **or** run Helm from the laptop with `KUBECONFIG` set. From `infra/`, continue at **section 1**.

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

Non-DB seed (safe before PGO). Run on the **host** (needs `BAO_TOKEN` + `openssl`), not inside the pod — keep the secret out of shell history if you can:

```bash
export BAO_TOKEN='<ROOT_TOKEN>'
export S3_ACCESS_KEY=pine-attachments
export S3_SECRET_KEY="$(openssl rand -hex 32)"
kubectl exec -i -n openbao openbao-0 -- \
  env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" \
  bao kv put secret/pine/attachment \
  s3_access_key="$S3_ACCESS_KEY" \
  s3_secret_key="$S3_SECRET_KEY"
# optional offline copy: printf '%s\n' "$S3_SECRET_KEY" > /root/.pine-s3-secret && chmod 600 /root/.pine-s3-secret
```

Seaweed still accepts any key until S3 identities are configured; this mainly avoids a trivial secret sitting in OpenBao. Reuse the same `S3_*` exports in section 4 when seeding the DB password into the same path.
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

| Cluster        | User / DB                 | Secret                                                     |
| -------------- | ------------------------- | ---------------------------------------------------------- |
| `identity`     | `identity`                | `identity-pguser-identity`                                 |
| `items`        | `issues`                  | `items-pguser-issues`                                      |
| `attachment`   | `attachment`              | `attachment-pguser-attachment`                             |
| `platform`     | `platform`                | `platform-pguser-platform`                                 |
| `notification` | `notification`            | `notification-pguser-notification`                         |
| `audit`        | `audit`                   | `audit-pguser-audit`                                       |
| `ory`          | `kratos`, `hydra`, `keto` | `ory-pguser-kratos`, `ory-pguser-hydra`, `ory-pguser-keto` |

`items` keeps user/db `issues` for `POSTGRES_ISSUES_PASSWORD`. Defaults: Postgres 18, `1Gi` data + backup, single instance.

### Ory `public` schema grants (Postgres 15+)

Before Kratos/Hydra/Keto migrate (Linux bash):

```bash
kubectl wait --for=condition=Ready pod \
  -n pine \
  -l postgres-operator.crunchydata.com/cluster=ory,postgres-operator.crunchydata.com/role=master \
  --timeout=10m

pod=$(kubectl get pods -n pine \
  -l postgres-operator.crunchydata.com/cluster=ory,postgres-operator.crunchydata.com/role=master \
  -o jsonpath='{.items[0].metadata.name}')
echo "ory primary pod=${pod}"
test -n "${pod}"

kubectl exec -n pine "$pod" -c database -- psql -U postgres -v ON_ERROR_STOP=1 -c \
  "ALTER DATABASE kratos OWNER TO kratos; ALTER DATABASE hydra OWNER TO hydra; ALTER DATABASE keto OWNER TO keto;"

for db in kratos hydra keto; do
  kubectl exec -n pine "$pod" -c database -- psql -U postgres -d "$db" -v ON_ERROR_STOP=1 -c \
    "GRANT ALL ON SCHEMA public TO ${db}; ALTER SCHEMA public OWNER TO ${db};"
done
```

---

## 4. Seed OpenBao + External Secrets

### Copy PGO passwords into OpenBao (host, once)

Needs `jq` on the host. Set token once, then each line:

```bash
export BAO_TOKEN='<ROOT_TOKEN>'
pw=$(kubectl get secret identity-pguser-identity -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_identity_password:$pw}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/identity -
pw=$(kubectl get secret items-pguser-issues -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_issues_password:$pw}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/items -
# Reuse S3_ACCESS_KEY / S3_SECRET_KEY from section 2 seed (or regenerate and overwrite both keys here)
: "${S3_ACCESS_KEY:?set S3_ACCESS_KEY}"; : "${S3_SECRET_KEY:?set S3_SECRET_KEY}"
pw=$(kubectl get secret attachment-pguser-attachment -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" --arg ak "$S3_ACCESS_KEY" --arg sk "$S3_SECRET_KEY" '{postgres_attachment_password:$pw,s3_access_key:$ak,s3_secret_key:$sk}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/attachment -
pw=$(kubectl get secret platform-pguser-platform -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_platform_password:$pw}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/platform -
pw=$(kubectl get secret notification-pguser-notification -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_notification_password:$pw}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/notification -
pw=$(kubectl get secret audit-pguser-audit -n pine -o jsonpath='{.data.password}' | base64 -d); jq -nc --arg pw "$pw" '{postgres_audit_password:$pw}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/audit -
```

| OpenBao path               | K8s Secret (via ESO)   | Keys today                                                       |
| -------------------------- | ---------------------- | ---------------------------------------------------------------- |
| `secret/pine/identity`     | `identity-secrets`     | `POSTGRES_IDENTITY_PASSWORD`                                     |
| `secret/pine/items`        | `items-secrets`        | `POSTGRES_ISSUES_PASSWORD`                                       |
| `secret/pine/attachment`   | `attachment-secrets`   | `POSTGRES_ATTACHMENT_PASSWORD`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| `secret/pine/platform`     | `platform-secrets`     | `POSTGRES_PLATFORM_PASSWORD`                                     |
| `secret/pine/notification` | `notification-secrets` | `POSTGRES_NOTIFICATION_PASSWORD`                                 |
| `secret/pine/audit`        | `audit-secrets`        | `POSTGRES_AUDIT_PASSWORD`                                        |

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

**Linux bash only** (on the VM after `sudo -i`, or laptop with `KUBECONFIG` set). Do not paste PowerShell (`New-OryDsn`, `[Convert]::…`) into this shell.

Charts `ory/*` `0.64.0`, app `v26.2.0` (Compose parity). cwd = `infra/`. Requires section 3: `ory` PostgresCluster Ready + `public` schema grants.

### 7.1 Prerequisites

```bash
kubectl get postgrescluster ory -n pine
kubectl get secrets -n pine | grep ory-pguser
# expect: ory-pguser-kratos, ory-pguser-hydra, ory-pguser-keto

kubectl wait --for=condition=Ready pod \
  -n pine \
  -l postgres-operator.crunchydata.com/cluster=ory,postgres-operator.crunchydata.com/role=master \
  --timeout=10m
```

If those secrets are missing, wait for PGO or re-apply `kubectl apply -f ./k8s/pgo/ory.yaml -n pine`. If grants were not run yet, do section 3 “Ory public schema grants” first.

### 7.2 DSN secrets (bash)

Builds `kratos-dsn` / `hydra-dsn` / `keto-dsn` from PGO URIs and appends `sslmode=require`:

```bash
ory_dsn() {
  local user="$1"
  local secret_name="$2"
  local uri dsn
  uri="$(kubectl get secret "ory-pguser-${user}" -n pine -o jsonpath='{.data.uri}' | base64 -d)"
  if [ -z "$uri" ]; then
    echo "missing uri in ory-pguser-${user}" >&2
    return 1
  fi
  case "$uri" in
    *\?*) dsn="${uri}&sslmode=require" ;;
    *)    dsn="${uri}?sslmode=require" ;;
  esac
  kubectl create secret generic "${secret_name}" \
    --namespace pine \
    --from-literal=dsn="${dsn}" \
    --dry-run=client -o yaml | kubectl apply -f -
}

ory_dsn kratos kratos-dsn
ory_dsn hydra hydra-dsn
ory_dsn keto keto-dsn

kubectl get secret kratos-dsn hydra-dsn keto-dsn -n pine
```

### 7.3 Keto OPL ConfigMap

From `infra/` (path is relative to the monorepo):

```bash
kubectl create configmap keto-opl \
  --namespace pine \
  --from-file=namespaces.ts=../services/authorization-service/src/integrations/authorization/ory-keto/opl/namespaces.ts \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl get configmap keto-opl -n pine
```

After later OPL edits: re-run the create/apply above, then `kubectl rollout restart deployment/keto -n pine`.

### 7.4 Helm install

```bash
helm repo add ory https://k8s.ory.sh/helm/charts
helm repo update

helm upgrade --install kratos ory/kratos \
  --namespace pine \
  --version 0.64.0 \
  --values ./k8s/kratos/values.yaml \
  --timeout 10m

helm upgrade --install hydra ory/hydra \
  --namespace pine \
  --version 0.64.0 \
  --values ./k8s/hydra/values.yaml \
  --timeout 10m

helm upgrade --install keto ory/keto \
  --namespace pine \
  --version 0.64.0 \
  --values ./k8s/keto/values.yaml \
  --timeout 10m
```

### 7.5 Check

```bash
helm list -n pine | grep -E 'kratos|hydra|keto'
kubectl get pods -n pine -l 'app.kubernetes.io/name in (kratos,hydra,keto)'
kubectl get deploy,svc -n pine | grep -E 'kratos|hydra|keto'
```

Migrate jobs can fail with SQLSTATE `42501` if section 3 grants were skipped — fix grants, then `helm upgrade --install` again (or delete the failed job and restart).

| Service | In-cluster URLs                                                           |
| ------- | ------------------------------------------------------------------------- |
| Kratos  | `http://kratos-public.pine.svc:4433`, `http://kratos-admin.pine.svc:4434` |
| Hydra   | `http://hydra-public.pine.svc:4444`, `http://hydra-admin.pine.svc:4445`   |
| Keto    | `http://keto-read.pine.svc:4466`, `http://keto-write.pine.svc:4467`       |

Lab cookie/cipher/system secrets in values are placeholders. Courier SMTP is a stub.

---

## 8. App images (OCIR) + microservices

Private registry for remote clusters (Oracle VM / OKE). Reuse the **same OCI tenancy** as the VM — no separate OCIR account. Platform images (Postgres, NATS, Seaweed, Ory) stay on public registries; only custom `pine/*` apps need OCIR.

| Step                                     | Where                                                            |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Auth Token + Object Storage namespace    | OCI Console (browser)                                            |
| `docker login` + `pnpm images:push:ocir` | **Laptop** (Docker Desktop + Pine repo)                          |
| Secret `ocir-pull` + Helm                | **Cluster** (`kubectl` / `helm`, VM or laptop with `KUBECONFIG`) |

Do not install Docker or the OCI CLI on the k3s VM for this step. The node only pulls via the pull secret.

### 8.1 Credentials (OCI Console)

1. **Object Storage namespace** (OCIR’s tenant / tenancy namespace) — profile menu (top right) → **Tenancy: …**, or **Governance & Administration → Tenancy details**. Copy the field **Object storage namespace**.
   - Tenancy **Name** and **Object storage namespace** are different fields. Always use **Object storage namespace**.
   - It is usually an **auto-generated alphanumeric string** (example shape: `ansh81vru1zp`). It is **not** the tenancy **Name**, email, Identity domain URL/`idcs-…`, or user OCID.
   - Using the tenancy **Name** produces: `denied: Tenant with namespace … not authorized or not found`.
   - Alternate view: **Developer Services → Container Registry** — the tenancy namespace is the root of the repository tree.
2. **OCI username** — **Identity → Domains → Default → Users → your user → Username** (often the email, e.g. `you@example.com`).
3. **Auth Token** — same user → **Auth tokens → Generate token**. Copy once. This is the Docker **password**. Do **not** use your OCI / email login password.

Docker username formats:

```text
<Object-Storage-namespace>/<oci-username>
```

If login succeeds on format but later fails as federated / identity-domain, include the domain name (often `Default`):

```text
<Object-Storage-namespace>/Default/<oci-username>
```

Older IdCS federation sometimes uses `oracleidentitycloudservice` instead of `Default`.

Example shape: `ansh81vru1zp/you@example.com` or `ansh81vru1zp/Default/you@example.com`.

Email alone → `Invalid username format`. Wrong first segment (tenancy **Name** instead of Object storage namespace) → `Tenant with namespace … not authorized or not found`.

### 8.2 Region key

Use the OCIR host for the region where you push images. Match your tenancy **home region** unless you deliberately use another.

| Home region (examples)      | `OCIR_REGION_KEY` | Registry host |
| --------------------------- | ----------------- | ------------- |
| India West (Mumbai)         | `bom`             | `bom.ocir.io` |
| US East (Ashburn)           | `iad`             | `iad.ocir.io` |
| US West (Phoenix)           | `phx`             | `phx.ocir.io` |
| Germany Central (Frankfurt) | `fra`             | `fra.ocir.io` |

Examples below use **Mumbai (`bom`)** — change the key if your home region differs.

### 8.3 Push images (laptop, repo root)

PowerShell (Docker Desktop running):

```powershell
cd C:\Users\Soura\dev\pine
docker login bom.ocir.io
```

When prompted:

- **Username:** `<Object-Storage-namespace>/<oci-username>`
- **Password:** Auth Token

```powershell
$env:OCIR_REGION_KEY = "bom"
$env:OCIR_NAMESPACE = "<Object-Storage-namespace>"
$env:OCIR_IMAGE_TAG = "0.1.0"
pnpm images:push:ocir
```

One service: `pnpm images:push:ocir -- --service identity`.

Script: `tools/scripts/oci/push-images.sh` (bash; Git Bash / WSL also fine with the same env vars). Ampere A1 nodes need **linux/arm64** images (build/push with `--platform linux/arm64` when the laptop is amd64).

### 8.4 Pull secret + overlay (cluster)

Edit `microservice/ocir.values.yaml`:

```yaml
image:
  registry: bom.ocir.io/<Object-Storage-namespace>
```

Create the pull secret (same username + Auth Token as login):

```bash
kubectl create secret docker-registry ocir-pull -n pine --docker-server=bom.ocir.io --docker-username='<Object-Storage-namespace>/<oci-username>' --docker-password='<auth-token>' --docker-email='<email>'
```

### 8.5 TLS secrets (lab)

From the **laptop** (repo root, `kubectl` pointed at the cluster):

```bash
pnpm tls:k8s
```

That runs `pnpm tls:generate` (writes `.local/tls/`) then `pnpm tls:secrets` (applies Secrets `identity-tls`, `items-tls`, … in namespace `pine` with keys `tls.crt`, `tls.key`, `ca.crt`). Override namespace with `PINE_NAMESPACE` if needed. Re-run `pnpm tls:secrets` alone after generating certs if Secrets already need refreshing.

### 8.6 Helm install apps

Thin chart: `microservice/` + `*.values.yaml`. Do not fork the chart. Chart supports `image.registry` and `imagePullSecrets`.

From `infra/` with `KUBECONFIG` set:

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

Apps also need OpenBao unsealed, ESO secrets (full `*_DATABASE_URL` where required), and TLS secrets before pods stay healthy.
---

## Namespaces

| Namespace              | Owns                                              |
| ---------------------- | ------------------------------------------------- |
| `pine`                 | Apps, PostgresClusters, ESO objects, Seaweed, Ory |
| `pine-gateway`         | Gateway + HTTPRoutes                              |
| `envoy-gateway-system` | Envoy Gateway                                     |
| `openbao`              | OpenBao                                           |
| `postgres-operator`    | PGO                                               |
| `external-secrets`     | ESO                                               |
| `nats`                 | NATS + nack + streams                             |

---

## Checks

```bash
kubectl get gateway,httproute -A
kubectl get postgresclusters -n pine
kubectl get secretstores,externalsecrets -n pine
kubectl get pods,svc,streams -n nats
kubectl get pods -n pine -l 'app.kubernetes.io/name in (seaweedfs,kratos,hydra,keto)'
kubectl get deploy,pods -n pine
helm template identity ./k8s/microservice -n pine -f ./k8s/microservice/identity.values.yaml -f ./k8s/microservice/ocir.values.yaml --set image.registry=bom.ocir.io/example
```

---

## Notes / open gaps

- Fresh cluster for staging/prod; do not migrate Docker Desktop state.
- Seed full `*_DATABASE_URL` into OpenBao/ESO before expecting app pods to stay up.
- ClamAV / web apps not on this chart path yet.
- Lab OpenBao uses root token; prefer AppRole/K8s auth before shared staging.
- Destructive uninstalls (delete releases, wipe PVCs) → confirm first.
