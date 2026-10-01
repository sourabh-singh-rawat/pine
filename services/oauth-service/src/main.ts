import { configureTls } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.OAUTH_SERVICE_TLS_CERT_PATH,
  keyPath: env.OAUTH_SERVICE_TLS_KEY_PATH,
});

import type { IHttpServer } from "@pine/server";
import { initializeObservability } from "@pine/observability";
import { container, TYPES } from "@/bootstrap";
import { openApiOutputPath } from "@/bootstrap/container";
import { logger } from "@/bootstrap/logger";
import type { IClientSeederService } from "@/features/clients";

export { container } from "@/bootstrap";

const main = async () => {
  const observability = initializeObservability({
    enabled: true,
    serviceName: "oauth-service",
    serviceVersion: "0.0.0",
    environment: env.NODE_ENV,
    serviceNamespace: "pine",
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  });
  observability?.start();

  const httpServer = container.get<IHttpServer>(TYPES.HttpServer);
  await httpServer.start();
  logger.info("OAuth service listening on https://0.0.0.0:5008");
  httpServer.writeOpenApi(openApiOutputPath);

  await container.get<IClientSeederService>(TYPES.ClientSeederService).seed();
};

main().catch((error) => {
  console.log(error);
});
