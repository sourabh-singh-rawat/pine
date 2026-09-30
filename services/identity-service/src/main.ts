import { configureTls, type IWorker } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.IDENTITY_SERVICE_TLS_CERT_PATH,
  keyPath: env.IDENTITY_SERVICE_TLS_KEY_PATH,
});

import type { IHttpServer } from "@pine/server";
import { initializeObservability } from "@pine/observability";
import { broker, container, initializeDb, TYPES } from "@/bootstrap";
import { openApiOutputPath } from "@/bootstrap/container";
import { writeSchemaToDist } from "@/bootstrap/graphql";
import { logger } from "@/bootstrap/logger";
import type { IClientSeederService } from "@/features/clients";
import { ProfilePhotoAttachmentConsumer } from "@/features/profiles";

export { container, db } from "@/bootstrap";
export { builder, createContext } from "@/graphql";
export type { AuthContext } from "@/graphql";
export { schema } from "@/graphql/schema";

const main = async () => {
  const observability = initializeObservability({
    enabled: true,
    serviceName: "identity-service",
    serviceVersion: "0.0.0",
    environment: env.NODE_ENV,
    serviceNamespace: "pine",
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  });
  observability?.start();

  await initializeDb();

  writeSchemaToDist();

  const httpServer = container.get<IHttpServer>(TYPES.HttpServer);
  await httpServer.start();
  logger.info("Identity service listening on http://0.0.0.0:5000");
  httpServer.writeOpenApi(openApiOutputPath);

  await broker.init();

  await container.get<IClientSeederService>(TYPES.ClientSeederService).seed();

  void container.get<IWorker>(TYPES.OutboxWorker).start();
  void container.get<IWorker>(TYPES.OutboxCleanupWorker).start();
  void container.get<ProfilePhotoAttachmentConsumer>(TYPES.ProfilePhotoAttachmentConsumer).start();
};

main().catch((error) => {
  console.log(error);
});
