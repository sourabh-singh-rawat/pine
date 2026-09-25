import { configureTls } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.PLATFORM_SERVICE_TLS_CERT_PATH,
  keyPath: env.PLATFORM_SERVICE_TLS_KEY_PATH,
});

import type { IOutboxCleanupWorker, IOutboxWorker } from "@pine/outbox";
import type { IHttpServer } from "@pine/server";
import { initializeObservability } from "@pine/observability";
import { bindHttpServer, broker, container, initializeDb, TYPES } from "@/bootstrap";
import { openApiOutputPath } from "@/bootstrap/container";
import { writeSchemaToDist } from "@/bootstrap/graphql";
import { logger } from "@/bootstrap/logger";
import { PlatformIdentitySyncConsumer } from "@/features/identities";
import { PlatformUserOnboardingConsumer } from "@/features/onboarding";

export { container, db } from "@/bootstrap";
export { builder, createContext } from "@/graphql";
export type { AuthContext } from "@/graphql";

const main = async () => {
  const observability = initializeObservability({
    enabled: true,
    serviceName: "platform-service",
    serviceVersion: "0.0.0",
    environment: env.NODE_ENV,
    serviceNamespace: "pine",
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  });
  observability?.start();

  await initializeDb();
  await bindHttpServer();
  await writeSchemaToDist();

  const httpServer = container.get<IHttpServer>(TYPES.HttpServer);
  await httpServer.start();
  logger.info("Platform service listening on http://0.0.0.0:5005");
  httpServer.writeOpenApi(openApiOutputPath);

  await broker.init();

  void container.get<IOutboxWorker>(TYPES.OutboxWorker).start();
  void container.get<IOutboxCleanupWorker>(TYPES.OutboxCleanupWorker).start();
  void container.get<PlatformIdentitySyncConsumer>(TYPES.PlatformIdentitySyncConsumer).start();
  void container.get<PlatformUserOnboardingConsumer>(TYPES.PlatformUserOnboardingConsumer).start();
};

main().catch((error) => {
  console.log(error);
});
