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

## Helm release for Nats Controller

```powershell
kubectl apply -f https://github.com/nats-io/nack/releases/latest/download/crds.yml
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm install nats nats/nats --values ./k8s/nats/values.yaml
helm install nack nats/nack --set jetstream.nats.url=nats://nats:4222
```

## Create Nats Streams and Consumers

```powershell
# Streams
helm install email-stream ./k8s/nats-stream --set streamName=email
helm install project-stream ./k8s/nats-stream --set streamName=project
helm install issue-stream ./k8s/nats-stream --set streamName=issue
helm install user-stream ./k8s/nats-stream --set streamName=user
helm install workspace-stream ./k8s/nats-stream --set streamName=workspace

# Consumers
# User
helm install user-created-consumer ./k8s/nats-consumer --values ./k8s/nats-consumer/values/user.created.yaml
helm install user-updated-consumer ./k8s/nats-consumer --values ./k8s/nats-consumer/values/user.updated.yaml

# Project
helm install project-created-consumer ./k8s/nats-consumer --values ./k8s/nats-consumer/values/project.created.yaml
helm install project-updated-consumer ./k8s/nats-consumer --values ./k8s/nats-consumer/values/project.updated.yaml
helm install project-member-created-consumer ./k8s/nats-consumer --values ./k8s/nats-consumer/values/project.member-created.yaml

# Issue
helm install issue-created-consumer ./k8s/nats-consumer --values ./k8s/nats-consumer/values/issue.created.yaml

# Email
helm install email-created-consumer ./k8s/nats-consumer --values ./k8s/nats-consumer/values/email.created.yaml

# Workspace
helm install workspace-created-consumer ./k8s/nats-consumer --values ./k8s/nats-consumer/values/workspace.created.yaml
helm install workspace-updated-consumer ./k8s/nats-consumer --values ./k8s/nats-consumer/values/workspace.updated.yaml
helm install workspace-invite-created-consumer ./k8s/nats-consumer --values ./k8s/nats-consumer/values/workspace.invite.yaml
```

## Use google DNS

```powershell
kubectl edit configmap coredns -n kube-system

# Replace forward block with
forward . 8.8.8.8 8.8.4.4 {
    max_concurrent 1000
}

kubectl rollout restart deployment coredns -n kube-system
```
