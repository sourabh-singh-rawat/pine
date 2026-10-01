# Pine Kubernetes (OCI VM)

Install/runbook for **one OCI Ampere A1 VM + single-node k3s**. Re-run the same steps on every new lab VM: set the variables in section 0 once per host, then walk 0→8.

**This file is VM-only** (Linux bash on the host). Other environments get their own docs later. Grow this file for the OCI k3s path; do not add per-folder READMEs under `infra/k8s/*/`.

**Shell:** after `sudo -i` on the VM. Commands assume cwd `infra/` (Pine repo cloned on the VM) unless noted. Export `KUBECONFIG` as in section 0 before sections 1–8. Agent playbook: [`.grok/skills/k8s/SKILL.md`](../../.grok/skills/k8s/SKILL.md).

## Layout

```text
infra/k8s/
  pine/              Namespace pine + ReferenceGrant
  envoy/             Gateway + HTTPRoutes + BackendTLSPolicy
  openbao/           (Helm only — no apply YAMLs)
  pgo/               Namespace pine-data + PostgresCluster YAMLs (incl. ory)
  external-secrets/  SecretStore + ExternalSecrets
  nats/              Helm values + Stream CRs
  seaweed/           All-in-one S3
  kratos/ hydra/ keto/   Ory Helm values
  microservice/      App chart + per-service values + ocir overlay
```

## Install order

Same recipe for every OCI lab VM:

0. OCI VM + k3s (host) — once per VM
1. Envoy Gateway + pine namespace
2. OpenBao (init / unseal / seed) — init once per VM; unseal after every OpenBao restart
3. PGO operator + PostgresClusters
4. OpenBao DB password seed + External Secrets
5. NATS + nack + streams
6. SeaweedFS
7. Ory (Kratos / Hydra / Keto)
8. OCIR images + microservice Helm

Sections 1–8 use `helm upgrade --install` / `kubectl apply` and are safe to re-run (fix or continue). Section 0 is host bootstrap: skip k3s install if the node is already Ready; do a full new section 0 only on a new VM.

---

## 0. OCI VM + k3s

Solo / Always Free path: one **Ampere A1** VM (`VM.Standard.A1.Flex`, up to **2 OCPU / 12 GB**), **Oracle Linux 9** (aarch64), single-node **k3s**. App images must be **linux/arm64**.

### Enter the host as root

SSH as `opc`, then:

```bash
sudo -i
```

Section 0 and later install commands assume this root login shell (`sudo -i`): host prep, firewalld, k3s, Helm, and `kubectl`/`helm` against the local node.

### Cluster variables (set every install)

Copy this block at the start of each new VM (after `sudo -i`). Use a distinct `CLUSTER_NAME` per VM so on-box kubeconfig paths stay distinct.

```bash
# Unique name for this cluster/VM (OCI display name + kubeconfig stem)
export CLUSTER_NAME=pine-cluster-main

# Public IP from OCI Console (or: curl -sf -4 ifconfig.me)
export PUBLIC_IP=x.x.x.x

# Where this shell finds k3s/kubectl/helm (OL9 root PATH often omits /usr/local/bin)
export PATH="/usr/local/bin:$PATH"

# After k3s is up:
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

Repeat this for each new lab VM (new instance → new `CLUSTER_NAME` / `PUBLIC_IP` → same commands below).

### Security list / NSG (VCN)

Allow inbound to the instance (source = your IP for admin; `0.0.0.0/0` only if you accept the risk). Reuse the same VCN rules for every lab VM in that subnet, or attach the same NSG.

| Port     | Why                          |
| -------- | ---------------------------- |
| TCP 22   | SSH                          |
| TCP 6443 | Kubernetes API               |
| TCP 80   | HTTP Gateway (Envoy)         |
| TCP 443  | HTTPS later                  |

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

Disable Traefik so Pine’s Envoy Gateway owns ingress (section 1). `--tls-san` must include this cluster’s `PUBLIC_IP` (or DNS) for API access via that address.

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

### Kubeconfig (on the VM)

As root (`sudo -i`):

```bash
mkdir -p ~/.kube
cp /etc/rancher/k3s/k3s.yaml "$HOME/.kube/${CLUSTER_NAME}.yaml"
chmod 600 "$HOME/.kube/${CLUSTER_NAME}.yaml"
export KUBECONFIG="$HOME/.kube/${CLUSTER_NAME}.yaml"
kubectl get nodes
```

Do not install Rancher on an Always Free box.

### Helm + tools (on the VM)

Idempotent installer:

```bash
export PATH="/usr/local/bin:$PATH"
command -v helm >/dev/null || curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
kubectl version --client
```

### New VM checklist

| Step         | Action                                                          |
| ------------ | --------------------------------------------------------------- |
| New VM       | New OCI instance + `CLUSTER_NAME` / `PUBLIC_IP`                 |
| Section 0    | Host prep → firewalld → k3s → kubeconfig → Helm                 |
| Sections 1–8 | Same commands; `export KUBECONFIG=…` first                      |
| Tear down    | Delete the OCI instance (or `k3s-uninstall.sh`)                 |

### Then

Clone or pull the Pine repo on this VM. From `infra/`, continue at **section 1**.

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
- After `pnpm tls:k8s` (ConfigMap `pine-ca` in `pine`), apply backend TLS so Envoy speaks HTTPS to the gateways:

```bash
kubectl apply -f ./k8s/envoy/backend-tls.yaml
```

`BackendTLSPolicy` targets Services `api-gateway` / `data-gateway` (port name `https`) with SNI `*.pine.svc` and CA from ConfigMap `pine-ca`. Without this, curls to `/api` and `/data` return 503 while the pods are healthy.

---

## 2. OpenBao

Standalone lab chart (not HA). Cluster secrets live in OpenBao → External Secrets.

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

Operator Helm lives in **`postgres-operator`**. PostgresClusters (data pods, PVCs, `*-pguser-*` Secrets) live in **`pine-data`**. App / Ory Deployments stay in **`pine`** and reach Postgres via DNS (`*.pine-data.svc`).

`k8s/pgo/` must include `namespace.yaml` (`name: pine-data`) and every PostgresCluster must set `metadata.namespace: pine-data`. YAMLs with no namespace land in **`default`**; re-running apply then reports `unchanged` while `kubectl get … -n pine-data` stays empty. Confirm the checkout before apply:

```bash
test -f ./k8s/pgo/namespace.yaml
grep -n 'namespace: pine-data' ./k8s/pgo/*.yaml
kubectl get postgresclusters -A
```

If clusters already exist under `default` or `pine`, wipe them first (lab data loss), then apply into `pine-data`:

```bash
kubectl delete postgresclusters -n default --all --ignore-not-found
kubectl delete postgresclusters -n pine --all --ignore-not-found
kubectl get postgresclusters -A
```

```bash
helm upgrade --install pgo oci://registry.developers.crunchydata.com/crunchydata/pgo --namespace postgres-operator --create-namespace
kubectl wait --for=condition=Available deployment -l app.kubernetes.io/name=pgo --namespace postgres-operator --timeout=5m
kubectl apply -f ./k8s/pine/
kubectl apply -f ./k8s/pgo/
kubectl get ns pine-data
kubectl get postgresclusters -n pine-data
kubectl get pods -n pine-data
kubectl get secrets -n pine-data | grep pguser
```

Expect `namespace/pine-data` created or configured, seven PostgresClusters in **`pine-data`**, and pods there. If `pine-data` is missing or empty, stop — fix the YAMLs / wipe the wrong namespace; do not continue to schema grants or OpenBao seed.

| Cluster        | User / DB                 | Secret (namespace `pine-data`)                             |
| -------------- | ------------------------- | ---------------------------------------------------------- |
| `identity`     | `identity`                | `identity-pguser-identity`                                 |
| `items`        | `issues`                  | `items-pguser-issues`                                      |
| `attachment`   | `attachment`              | `attachment-pguser-attachment`                             |
| `platform`     | `platform`                | `platform-pguser-platform`                                 |
| `notification` | `notification`            | `notification-pguser-notification`                         |
| `audit`        | `audit`                   | `audit-pguser-audit`                                       |
| `ory`          | `kratos`, `hydra`, `keto` | `ory-pguser-kratos`, `ory-pguser-hydra`, `ory-pguser-keto` |

`items` keeps user/db `issues` for `POSTGRES_ISSUES_PASSWORD`. Defaults: Postgres 18, `1Gi` data + backup, single instance. PGO connection URIs use hosts like `identity-primary.pine-data.svc`.

### Ory `public` schema grants (Postgres 15+)

Run only after `kubectl get pods -n pine-data` shows a Ready ory instance. Before Kratos/Hydra/Keto migrate (Linux bash):

```bash
kubectl wait --for=condition=Ready pod \
  -n pine-data \
  -l postgres-operator.crunchydata.com/cluster=ory,postgres-operator.crunchydata.com/role=master \
  --timeout=10m

pod=$(kubectl get pods -n pine-data \
  -l postgres-operator.crunchydata.com/cluster=ory,postgres-operator.crunchydata.com/role=master \
  -o jsonpath='{.items[0].metadata.name}')
echo "ory primary pod=${pod}"
test -n "${pod}"

kubectl exec -n pine-data "$pod" -c database -- psql -U postgres -v ON_ERROR_STOP=1 -c \
  "ALTER DATABASE kratos OWNER TO kratos; ALTER DATABASE hydra OWNER TO hydra; ALTER DATABASE keto OWNER TO keto;"

for db in kratos hydra keto; do
  kubectl exec -n pine-data "$pod" -c database -- psql -U postgres -d "$db" -v ON_ERROR_STOP=1 -c \
    "GRANT ALL ON SCHEMA public TO ${db}; ALTER SCHEMA public OWNER TO ${db};"
done
```

---

## 4. Seed OpenBao + External Secrets

### Copy PGO passwords + database URLs into OpenBao (host, once)

Needs `jq` on the host. Builds each `*_DATABASE_URL` from the PGO `*-pguser-*` Secret `uri` field and appends `sslmode=no-verify`. Node `pg` treats `sslmode=require` like `verify-full`, which fails against PGO’s self-signed cluster CA with `SELF_SIGNED_CERT_IN_CHAIN`. Ory DSNs in §7.2 still use `sslmode=require` (Go/libpq). Set token once, then run:

```bash
export BAO_TOKEN='<ROOT_TOKEN>'
pgo_db_url() { local uri dsn; uri="$(kubectl get secret "$1" -n pine-data -o jsonpath='{.data.uri}' | base64 -d)"; [ -n "$uri" ] || { echo "missing uri in $1" >&2; return 1; }; case "$uri" in *\?*) dsn="${uri}&sslmode=no-verify" ;; *) dsn="${uri}?sslmode=no-verify" ;; esac; printf '%s' "$dsn"; }
pw=$(kubectl get secret identity-pguser-identity -n pine-data -o jsonpath='{.data.password}' | base64 -d); dburl=$(pgo_db_url identity-pguser-identity); jq -nc --arg pw "$pw" --arg dburl "$dburl" '{postgres_identity_password:$pw,identity_database_url:$dburl}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/identity -
pw=$(kubectl get secret items-pguser-issues -n pine-data -o jsonpath='{.data.password}' | base64 -d); dburl=$(pgo_db_url items-pguser-issues); jq -nc --arg pw "$pw" --arg dburl "$dburl" '{postgres_issues_password:$pw,issues_database_url:$dburl}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/items -
: "${S3_ACCESS_KEY:?set S3_ACCESS_KEY}"; : "${S3_SECRET_KEY:?set S3_SECRET_KEY}"
pw=$(kubectl get secret attachment-pguser-attachment -n pine-data -o jsonpath='{.data.password}' | base64 -d); dburl=$(pgo_db_url attachment-pguser-attachment); jq -nc --arg pw "$pw" --arg dburl "$dburl" --arg ak "$S3_ACCESS_KEY" --arg sk "$S3_SECRET_KEY" '{postgres_attachment_password:$pw,attachment_database_url:$dburl,s3_access_key:$ak,s3_secret_key:$sk}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/attachment -
pw=$(kubectl get secret platform-pguser-platform -n pine-data -o jsonpath='{.data.password}' | base64 -d); dburl=$(pgo_db_url platform-pguser-platform); jq -nc --arg pw "$pw" --arg dburl "$dburl" '{postgres_platform_password:$pw,platform_database_url:$dburl}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/platform -
pw=$(kubectl get secret notification-pguser-notification -n pine-data -o jsonpath='{.data.password}' | base64 -d); dburl=$(pgo_db_url notification-pguser-notification); jq -nc --arg pw "$pw" --arg dburl "$dburl" '{postgres_notification_password:$pw,notification_database_url:$dburl}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/notification -
pw=$(kubectl get secret audit-pguser-audit -n pine-data -o jsonpath='{.data.password}' | base64 -d); dburl=$(pgo_db_url audit-pguser-audit); jq -nc --arg pw "$pw" --arg dburl "$dburl" '{postgres_audit_password:$pw,audit_database_url:$dburl}' | kubectl exec -i -n openbao openbao-0 -- env BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN="$BAO_TOKEN" bao kv put secret/pine/audit -
```

Reuse `S3_ACCESS_KEY` / `S3_SECRET_KEY` from section 2 seed (or regenerate). `bao kv put` replaces the whole path — always include S3 keys when rewriting `secret/pine/attachment`.

| OpenBao path               | K8s Secret (via ESO)   | Keys                                                                 |
| -------------------------- | ---------------------- | -------------------------------------------------------------------- |
| `secret/pine/identity`     | `identity-secrets`     | `POSTGRES_IDENTITY_PASSWORD`, `IDENTITY_DATABASE_URL`                |
| `secret/pine/items`        | `items-secrets`        | `POSTGRES_ISSUES_PASSWORD`, `ISSUES_DATABASE_URL`                    |
| `secret/pine/attachment`   | `attachment-secrets`   | `POSTGRES_ATTACHMENT_PASSWORD`, `ATTACHMENT_DATABASE_URL`, S3 keys   |
| `secret/pine/platform`     | `platform-secrets`     | `POSTGRES_PLATFORM_PASSWORD`, `PLATFORM_DATABASE_URL`                |
| `secret/pine/notification` | `notification-secrets` | `POSTGRES_NOTIFICATION_PASSWORD`, `NOTIFICATION_DATABASE_URL`        |
| `secret/pine/audit`        | `audit-secrets`        | `POSTGRES_AUDIT_PASSWORD`, `AUDIT_DATABASE_URL`                      |

### External Secrets Operator

Wait for **all** ESO Deployments (controller, webhook, cert-controller). Waiting only on `app.kubernetes.io/name=external-secrets` leaves the validating webhook without endpoints; `kubectl apply -f ./k8s/external-secrets/` then fails with `no endpoints available for service "external-secrets-webhook"`.

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm upgrade --install external-secrets external-secrets/external-secrets --namespace external-secrets --create-namespace
kubectl wait --for=condition=Available deployment --all --namespace external-secrets --timeout=5m
kubectl get endpoints external-secrets-webhook -n external-secrets
kubectl create secret generic openbao-token --namespace pine --from-literal=token='<ROOT_TOKEN>' --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f ./k8s/external-secrets/ -n pine
kubectl get secretstores,externalsecrets,secrets -n pine
```

Healthy: SecretStore Ready, ExternalSecrets `SecretSynced`. Sealed OpenBao → `InvalidProviderConfig`. Wrong token → re-apply `openbao-token`. Webhook endpoint empty → wait again, then re-apply the ExternalSecret YAMLs.
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

In-cluster URL: `nats://nats.nats.svc:4222`. Streams: `attachment`, `authorization`, `identity`, `items`, `platform`. Apps do not create streams on this cluster.

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

Charts `ory/*` `0.64.0`, app `v26.2.0`. cwd = `infra/`. Requires section 3: `ory` PostgresCluster Ready + `public` schema grants.

### 7.1 Prerequisites

```bash
kubectl get postgrescluster ory -n pine-data
kubectl get secrets -n pine-data | grep ory-pguser
# expect: ory-pguser-kratos, ory-pguser-hydra, ory-pguser-keto

kubectl wait --for=condition=Ready pod \
  -n pine-data \
  -l postgres-operator.crunchydata.com/cluster=ory,postgres-operator.crunchydata.com/role=master \
  --timeout=10m
```

If those secrets are missing, wait for PGO or re-apply `kubectl apply -f ./k8s/pgo/ory.yaml`. If grants were not run yet, do section 3 “Ory public schema grants” first.

### 7.2 DSN secrets (bash)

Builds `kratos-dsn` / `hydra-dsn` / `keto-dsn` from PGO URIs and appends `sslmode=require`:

```bash
ory_dsn() {
  local user="$1"
  local secret_name="$2"
  local uri dsn
  uri="$(kubectl get secret "ory-pguser-${user}" -n pine-data -o jsonpath='{.data.uri}' | base64 -d)"
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

Private registry for this OCI VM. Reuse the **same OCI tenancy** as the VM — no separate OCIR account. Platform images (Postgres, NATS, Seaweed, Ory) stay on public registries; only custom `pine/*` apps need OCIR.

| Step                                     | Where on this VM                                      |
| ---------------------------------------- | ----------------------------------------------------- |
| Auth Token + Object Storage namespace    | OCI Console (browser)                                 |
| `docker login` + `pnpm images:push:ocir` | Pine repo + Docker on the VM                          |
| Secret `ocir-pull` + Helm                | `kubectl` / `helm` on the VM                          |

Build and push **linux/arm64** images on this Ampere host, then pull via the `ocir-pull` secret.

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

### 8.3 Push images (VM, repo root)

Requires Docker and the Pine repo on this VM. Match image platform to the node (`uname -m`: `x86_64` → `linux/amd64`, `aarch64` → `linux/arm64`).

```bash
cd <pine-repo-root>
docker login bom.ocir.io
```

When prompted:

- **Username:** `<Object-Storage-namespace>/<oci-username>`
- **Password:** Auth Token

```bash
export OCIR_REGION_KEY=bom
export OCIR_NAMESPACE=<Object-Storage-namespace>
export OCIR_IMAGE_TAG=0.1.0
# optional: export OCIR_PLATFORM=linux/arm64   # Ampere A1; default is linux/amd64
pnpm images:push:ocir
```

Builds use `docker buildx build --platform <arch> --provenance=false --sbom=false`. Default platform is `linux/amd64` (e.g. `VM.Standard.E5.Flex`). Pass `--platform linux/arm64` or `OCIR_PLATFORM=linux/arm64` for Ampere A1. A platform mismatch CrashLoops with `Exec format error`.

One service: `pnpm images:push:ocir -- --service identity`.

Parallelism: default 3 concurrent builds (`OCIR_BUILD_JOBS` or `--jobs N`). Example: `pnpm images:push:ocir -- --jobs 4`.

`api-gateway` image bake: the push script copies `services/api-gateway/dist/supergraph.graphql` and `platform.openapi.json` into `services/api-gateway/docker-assets/` (gitignored) so the Dockerfile can place them under `/app/dist/`. Do **not** commit those generated files. If `dist/` is missing them, the script runs `pnpm schemas:compose` (requires subgraph `services/*/dist/schema.graphql` / OpenAPI inputs first).

Script: `tools/scripts/oci/push-images.sh`.

### 8.4 Pull secret + overlay

Committed `microservice/ocir.values.yaml` keeps a **lowercase** placeholder registry (`bom.ocir.io/replace-ocir-namespace`). Do **not** commit your real Object Storage namespace. Prefer `--set image.registry=…` at install time (see §8.6). Use only lowercase path segments — uppercase in the image path yields `InvalidImageName`.

Create the pull secret (same username + Auth Token as login):

```bash
kubectl create secret docker-registry ocir-pull -n pine --docker-server=bom.ocir.io --docker-username='<Object-Storage-namespace>/<oci-username>' --docker-password='<auth-token>' --docker-email='<email>'
```

### 8.5 TLS secrets (lab)

From the Pine repo root on this VM (`KUBECONFIG` set):

```bash
pnpm tls:k8s
```

That runs `pnpm tls:generate` (writes `.local/tls/`) then `pnpm tls:secrets` (applies Secrets `identity-tls`, `items-tls`, … in namespace `pine` with keys `tls.crt`, `tls.key`, `ca.crt`, plus ConfigMap `pine-ca` with `ca.crt` for Envoy `BackendTLSPolicy`). Override namespace with `PINE_NAMESPACE` if needed. Re-run `pnpm tls:secrets` alone after generating certs if Secrets already need refreshing. Then `kubectl apply -f ./k8s/envoy/backend-tls.yaml` if not already applied.

### 8.6 Helm install apps

Thin chart: `microservice/` + `*.values.yaml`. Do not fork the chart. Chart supports `image.registry` and `imagePullSecrets`.

From `infra/`. Export the real **lowercase** Object Storage namespace registry and the tag you pushed, then install each app with repeated `-f` flags and `--set` (do not leave the committed placeholder):

```bash
export OCIR_VALUES=./k8s/microservice/ocir.values.yaml
export OCIR_REGISTRY=bom.ocir.io/<Object-Storage-namespace>
export OCIR_TAG=0.1.0
helm template identity ./k8s/microservice -n pine -f ./k8s/microservice/identity.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG" | grep 'image:'
helm upgrade --install identity ./k8s/microservice -n pine -f ./k8s/microservice/identity.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
helm upgrade --install items ./k8s/microservice -n pine -f ./k8s/microservice/items.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
helm upgrade --install attachment ./k8s/microservice -n pine -f ./k8s/microservice/attachment.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
helm upgrade --install platform ./k8s/microservice -n pine -f ./k8s/microservice/platform.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
helm upgrade --install authorization ./k8s/microservice -n pine -f ./k8s/microservice/authorization.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
helm upgrade --install audit ./k8s/microservice -n pine -f ./k8s/microservice/audit.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
helm upgrade --install notification ./k8s/microservice -n pine -f ./k8s/microservice/notification.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
helm upgrade --install attachment-scanner ./k8s/microservice -n pine -f ./k8s/microservice/attachment-scanner.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
helm upgrade --install attachment-image-processing ./k8s/microservice -n pine -f ./k8s/microservice/attachment-image-processing.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
helm upgrade --install api-gateway ./k8s/microservice -n pine -f ./k8s/microservice/api-gateway.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
helm upgrade --install data-gateway ./k8s/microservice -n pine -f ./k8s/microservice/data-gateway.values.yaml -f "$OCIR_VALUES" --set image.registry="$OCIR_REGISTRY" --set image.tag="$OCIR_TAG"
kubectl get deploy,svc,pods -n pine
```

Expect image like `bom.ocir.io/<namespace>/pine/identity-service:0.1.0` (all lowercase). `InvalidImageName` = malformed reference (often uppercase left in the path). `ErrImagePull` / `ImagePullBackOff` = name valid but pull failed (wrong registry/tag, missing `ocir-pull`, or Auth Token). `no space left on device` on the node → free images with `k3s crictl rmi --prune` (and/or grow the OCI boot volume) before reinstalling.

Apps also need OpenBao unsealed, ESO secrets (full `*_DATABASE_URL` where required), and TLS secrets before pods stay healthy.

### 8.7 Uninstall app releases only

Removes the eleven `microservice` Helm releases. Leaves Ory (`kratos` / `hydra` / `keto`) and other infra in place:

```bash
helm -n pine uninstall identity items attachment platform authorization audit notification attachment-scanner attachment-image-processing api-gateway data-gateway
helm -n pine list
kubectl -n pine get deploy,pods
k3s crictl rmi --prune
df -h /
```

Then reinstall with §8.6.
---

## Namespaces

| Namespace              | Owns                                                         |
| ---------------------- | ------------------------------------------------------------ |
| `pine`                 | Apps, ESO objects / `*-secrets`, Seaweed, Ory                |
| `pine-data`            | PostgresClusters, PGO `*-pguser-*` Secrets, DB pods / PVCs   |
| `pine-gateway`         | Gateway + HTTPRoutes                                         |
| `envoy-gateway-system` | Envoy Gateway                                                |
| `openbao`              | OpenBao                                                      |
| `postgres-operator`    | PGO operator (Helm)                                          |
| `external-secrets`     | ESO                                                          |
| `nats`                 | NATS + nack + streams                                        |

---

## Checks

```bash
kubectl get gateway,httproute -A
kubectl get postgresclusters -n pine-data
kubectl get secretstores,externalsecrets -n pine
kubectl get pods,svc,streams -n nats
kubectl get pods -n pine -l 'app.kubernetes.io/name in (seaweedfs,kratos,hydra,keto)'
kubectl get deploy,pods -n pine
helm template identity ./k8s/microservice -n pine -f ./k8s/microservice/identity.values.yaml -f ./k8s/microservice/ocir.values.yaml --set image.registry=bom.ocir.io/example
```

---

## Notes / open gaps

- Seed full `*_DATABASE_URL` into OpenBao/ESO before expecting app pods to stay up (hosts must use `*.pine-data.svc`, not `*.pine.svc`).
- PostgresClusters in `default` or `pine` (old checkout or missing `metadata.namespace`) need a wipe/recreate into `pine-data` (do not migrate PVCs in place without a plan). See §3.
- ClamAV / web apps not on this chart path yet.
- Lab OpenBao uses root token; prefer AppRole/K8s auth before shared staging.
- Destructive uninstalls (delete releases, wipe PVCs) → confirm first.
- **Out of scope here (separate docs later):** other local/dev Kubernetes paths; Docker Compose on a VM.
