---
name: observability
description: >
  @pine/observability OTEL + local Alloy/Tempo/Loki/Grafana. Use when
  instrumenting a service or running the local observability profile.
when-to-use: >
  OTEL, tracing, Alloy, OTEL_EXPORTER_OTLP_ENDPOINT, observability profile,
  initializeObservability
---

# Observability

SDK: `@pine/observability` → OTLP gRPC. Local stack: `pnpm dev:infra:observability` (Alloy :4317 → Tempo/Loki/Prometheus). Related: `docker-infra`, `dev-loop`.

## Recipe

Call before accepting traffic. `serviceName` must match the deployable. Local OTLP: `http://127.0.0.1:4317`. `enabled: false` → `null`; still call `?.start()`.

```ts
const observability = initializeObservability({
  enabled: true,
  serviceName: "identity-service",
  serviceVersion: "0.0.0",
  environment: env.NODE_ENV,
  serviceNamespace: "pine",
  otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
});
observability?.start();
```

Env: `OTEL_EXPORTER_OTLP_ENDPOINT` in root `.env.example`. Instrumentations: HTTP, Fastify (`@fastify/otel`), GraphQL, pg. Extend `packages/observability/src/bootstrap/node-sdk.ts` only.

```bash
pnpm dev:infra:observability
```

Without the profile, **:4317 is closed**. Point services at Alloy, not Tempo. Config: `infra/docker/observability/{config.alloy,tempo,loki,prometheus}.yaml`. Grafana: `GRAFANA_ADMIN_PASSWORD` in root `.env`.

## Anti-patterns

- Feature-local OTEL outside `@pine/observability`
- Exporting directly to Tempo locally
- `serviceName` that does not match the deployable

## Done when

- Bootstrap calls `initializeObservability` + `start()` before traffic
- Endpoint comes from root env
- Shared instrumentations live only in `packages/observability`
