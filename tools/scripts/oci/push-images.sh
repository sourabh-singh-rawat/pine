#!/usr/bin/env bash
set -euo pipefail

REGION_KEY="${OCIR_REGION_KEY:-}"
NAMESPACE="${OCIR_NAMESPACE:-}"
TAG="${OCIR_IMAGE_TAG:-0.1.0}"
PLATFORM="${OCIR_PLATFORM:-linux/amd64}"
MAX_JOBS="${OCIR_BUILD_JOBS:-3}"
SKIP_PUSH=0
SKIP_LOGIN=0
FILTERS=()

usage() {
  echo "Usage: OCIR_REGION_KEY=bom OCIR_NAMESPACE=<object-storage-ns> $0 [--platform linux/amd64|linux/arm64] [--service name]... [--jobs N] [--skip-push] [--skip-login]" >&2
  echo "Env fallback: OCIR_REGION_KEY, OCIR_NAMESPACE, OCIR_IMAGE_TAG, OCIR_PLATFORM, OCIR_BUILD_JOBS" >&2
  echo "Default platform is linux/amd64 (e.g. VM.Standard.E5.Flex). Use linux/arm64 for Ampere A1." >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform|-p)
      [[ $# -ge 2 ]] || usage
      PLATFORM="$2"
      shift 2
      ;;
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
case "$PLATFORM" in
  linux/amd64|linux/arm64) ;;
  *)
    echo "--platform / OCIR_PLATFORM must be linux/amd64 or linux/arm64 (got: $PLATFORM)" >&2
    exit 1
    ;;
esac

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
  "pine/oauth-service|@pine/oauth-service|services/oauth-service"
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
echo "Platform: $PLATFORM"
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

prepare_api_gateway_docker_assets() {
  local assets_dir="services/api-gateway/docker-assets"
  local supergraph="services/api-gateway/dist/supergraph.graphql"
  local openapi="services/api-gateway/dist/platform.openapi.json"

  mkdir -p "$assets_dir"

  if [[ ! -f "$supergraph" || ! -f "$openapi" ]]; then
    echo "Composing api-gateway supergraph + OpenAPI (needs services/*/dist/schema.graphql and openapi inputs)"
    pnpm schemas:compose
  fi

  if [[ ! -f "$supergraph" || ! -f "$openapi" ]]; then
    echo "Missing $supergraph and/or $openapi after schemas:compose." >&2
    echo "Boot GraphQL/OpenAPI subgraphs once (or emit dist schemas), then re-run." >&2
    exit 1
  fi

  cp "$supergraph" "$assets_dir/supergraph.graphql"
  cp "$openapi" "$assets_dir/platform.openapi.json"
  echo "Prepared $assets_dir for api-gateway image bake"
}

needs_api_gateway_assets=0
for entry in "${selected[@]}"; do
  if [[ "${entry%%|*}" == "pine/api-gateway" ]]; then
    needs_api_gateway_assets=1
    break
  fi
done
if [[ "$needs_api_gateway_assets" -eq 1 ]]; then
  prepare_api_gateway_docker_assets
fi

build_one() {
  local entry="$1"
  local image rest package dir full
  image="${entry%%|*}"
  rest="${entry#*|}"
  package="${rest%%|*}"
  dir="${rest#*|}"
  full="${REGISTRY_PREFIX}/${image}:${TAG}"
  echo "Building $full ($PLATFORM)"
  local -a build_args=(
    buildx build
    --platform "$PLATFORM"
    --provenance=false
    --sbom=false
    --target runtime
    --build-arg "SERVICE=${package}"
    --build-arg "SERVICE_DIR=${dir}"
    -t "$full"
  )
  if [[ "$SKIP_PUSH" -eq 0 ]]; then
    build_args+=(--push)
  else
    build_args+=(--load)
  fi
  build_args+=(.)
  docker "${build_args[@]}"
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
