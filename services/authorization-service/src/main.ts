import { configureTls } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.AUTHORIZATION_SERVICE_TLS_CERT_PATH,
  keyPath: env.AUTHORIZATION_SERVICE_TLS_KEY_PATH,
});

import type { IHttpServer } from "@pine/server";
import { initializeObservability } from "@pine/observability";
import { broker, container, TYPES } from "@/bootstrap";
import { openApiOutputPath } from "@/bootstrap/container";
import { logger } from "@/bootstrap/logger";
import { AuthorizationProfileSyncConsumer } from "@/features/identity";
import {
  AuthorizationItemSyncConsumer,
  AuthorizationListSyncConsumer,
  AuthorizationSpaceSyncConsumer,
} from "@/features/issues";

import {
  AuthorizationWorkspaceRelationSyncConsumer,
  AuthorizationWorkspaceSyncConsumer,
  AuthorizationPlatformRelationSyncConsumer,
  AuthorizationTenantRelationSyncConsumer,
  AuthorizationTenantSyncConsumer,
} from "@/features/platform";

export { container } from "@/bootstrap";

const main = async () => {
  const observability = initializeObservability({
    enabled: true,
    serviceName: "authorization-service",
    serviceVersion: "0.0.0",
    environment: env.NODE_ENV,
    serviceNamespace: "pine",
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  });
  observability?.start();

  const httpServer = container.get<IHttpServer>(TYPES.HttpServer);
  await httpServer.start();
  logger.info("Authorization service listening on http://0.0.0.0:5006");
  httpServer.writeOpenApi(openApiOutputPath);

  await broker.init();

  void container
    .get<AuthorizationTenantSyncConsumer>(TYPES.AuthorizationTenantSyncConsumer)
    .start();
  void container
    .get<AuthorizationWorkspaceSyncConsumer>(TYPES.AuthorizationWorkspaceSyncConsumer)
    .start();
  void container
    .get<AuthorizationWorkspaceRelationSyncConsumer>(
      TYPES.AuthorizationWorkspaceRelationSyncConsumer,
    )
    .start();
  void container
    .get<AuthorizationTenantRelationSyncConsumer>(TYPES.AuthorizationTenantRelationSyncConsumer)
    .start();
  void container
    .get<AuthorizationPlatformRelationSyncConsumer>(TYPES.AuthorizationPlatformRelationSyncConsumer)
    .start();
  void container
    .get<AuthorizationProfileSyncConsumer>(TYPES.AuthorizationProfileSyncConsumer)
    .start();
  void container
    .get<AuthorizationSpaceSyncConsumer>(TYPES.AuthorizationSpaceSyncConsumer)
    .start();
  void container
    .get<AuthorizationListSyncConsumer>(TYPES.AuthorizationListSyncConsumer)
    .start();
  void container
    .get<AuthorizationItemSyncConsumer>(TYPES.AuthorizationItemSyncConsumer)
    .start();
};

main().catch((error) => {
  console.log(error);
});
