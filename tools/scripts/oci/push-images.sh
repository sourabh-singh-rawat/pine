#!/usr/bin/env bash
set -euo pipefail

REGION_KEY="${OCIR_REGION_KEY:-}"
NAMESPACE="${OCIR_NAMESPACE:-}"
TAG="${OCIR_IMAGE_TAG:-0.1.0}"
MAX_JOBS="${OCIR_BUILD_JOBS:-3}"
SKIP_PUSH=0
SKIP_LOGIN=0
FILTERS=()

usage() {
  echo "Usage: OCIR_REGION_KEY=bom OCIR_NAMESPACE=<object-storage-ns> $0 [--service name]... [--jobs N] [--skip-push] [--skip-login]" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service|-s)
      [[ $# -ge 2 ]] || usage
      FILTERS+=("$2")
      shift 2
      ;;
    --jobs|-j)
      [[ $# -ge 2 ]] || usage
      MAX_JOBS="$2"
      shift 2
      ;;
    --skip-push)
      SKIP_PUSH=1
      shift
      ;;
    --skip-login)
      SKIP_LOGIN=1
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      ;;
  esac
done

if [[ -z "$REGION_KEY" ]]; then
  echo "Set OCIR_REGION_KEY (e.g. bom for Mumbai, iad for Ashburn, phx, fra)." >&2
  exit 1
fi
if [[ -z "$NAMESPACE" ]]; then
  echo "Set OCIR_NAMESPACE to the tenancy Object Storage namespace (Tenancy details in OCI Console)." >&2
  exit 1
fi
if ! [[ "$MAX_JOBS" =~ ^[1-9][0-9]*$ ]]; then
  echo "OCIR_BUILD_JOBS / --jobs must be a positive integer (got: $MAX_JOBS)" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
HOST="${REGION_KEY}.ocir.io"
REGISTRY_PREFIX="${HOST}/${NAMESPACE}"

SERVICES=(
  "pine/identity-service|@pine/identity-service|services/identity-service"
  "pine/items-service|@pine/items-service|services/items-service"
  "pine/attachment-service|@pine/attachment-service|services/attachment-service"
  "pine/attachment-scanner-service|@pine/attachment-scanner-service|services/attachment-scanner-service"
  "pine/attachment-image-processing-service|@pine/attachment-image-processing-service|services/attachment-image-processing-service"
  "pine/notification-service|@pine/notification-service|services/notification-service"
  "pine/platform-service|@pine/platform-service|services/platform-service"
  "pine/authorization-service|@pine/authorization-service|services/authorization-service"
  "pine/audit-service|@pine/audit-service|services/audit-service"
  "pine/api-gateway|@pine/api-gateway|services/api-gateway"
  "pine/data-gateway|@pine/data-gateway|services/data-gateway"
)

selected=()
for entry in "${SERVICES[@]}"; do
  image="${entry%%|*}"
  rest="${entry#*|}"
  package="${rest%%|*}"
  dir="${rest#*|}"
  if [[ ${#FILTERS[@]} -eq 0 ]]; then
    selected+=("$entry")
    continue
  fi
  for f in "${FILTERS[@]}"; do
    fl=$(echo "$f" | tr '[:upper:]' '[:lower:]')
    il=$(echo "$image" | tr '[:upper:]' '[:lower:]')
    pl=$(echo "$package" | tr '[:upper:]' '[:lower:]')
    if [[ "$il" == *"$fl"* || "$pl" == *"$fl"* ]]; then
      selected+=("$entry")
      break
    fi
  done
done

if [[ ${#selected[@]} -eq 0 ]]; then
  echo "No services matched filters: ${FILTERS[*]}" >&2
  exit 1
fi

echo "Registry: $REGISTRY_PREFIX"
echo "Tag:      $TAG"
echo "Jobs:     $MAX_JOBS"
echo -n "Services:"
for entry in "${selected[@]}"; do
  echo -n " ${entry%%|*}"
done
echo

if [[ "$SKIP_LOGIN" -eq 0 ]]; then
  echo "docker login $HOST (username: ${NAMESPACE}/<oci-user-or-email>, password: Auth Token)"
  docker login "$HOST"
fi

cd "$REPO_ROOT"

build_one() {
  local entry="$1"
  local image rest package dir full
  image="${entry%%|*}"
  rest="${entry#*|}"
  package="${rest%%|*}"
  dir="${rest#*|}"
  full="${REGISTRY_PREFIX}/${image}:${TAG}"
  echo "Building $full"
  docker build --target runtime \
    --build-arg "SERVICE=${package}" \
    --build-arg "SERVICE_DIR=${dir}" \
    -t "$full" \
    .
  if [[ "$SKIP_PUSH" -eq 0 ]]; then
    echo "Pushing $full"
    docker push "$full"
  fi
  echo "Done $full"
}

active=0
failures=0
for entry in "${selected[@]}"; do
  while (( active >= MAX_JOBS )); do
    if wait -n; then
      :
    else
      failures=$((failures + 1))
    fi
    active=$((active - 1))
  done
  build_one "$entry" &
  active=$((active + 1))
done

while (( active > 0 )); do
  if wait -n; then
    :
  else
    failures=$((failures + 1))
  fi
  active=$((active - 1))
done

if [[ "$failures" -ne 0 ]]; then
  echo "Failed: $failures build(s)" >&2
  exit 1
fi

echo "Done. Helm overlay image.registry should be: $REGISTRY_PREFIX"
echo "Example: helm upgrade --install identity ./k8s/microservice -n pine -f ./k8s/microservice/identity.values.yaml -f ./k8s/microservice/ocir.values.yaml --set image.registry=$REGISTRY_PREFIX --set image.tag=$TAG"
