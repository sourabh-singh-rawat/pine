import { configureTls, type IWorker } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.ATTACHMENT_SERVICE_TLS_CERT_PATH,
  keyPath: env.ATTACHMENT_SERVICE_TLS_KEY_PATH,
});

import type { IHttpServer } from "@pine/server";
import { bindHttpServer, broker, container, initializeDb, logger, TYPES } from "@/bootstrap";
import { openApiOutputPath } from "@/bootstrap/container";
import { writeSchemaToDist } from "@/bootstrap/graphql";
import { startImageWorker } from "@/bootstrap/image-worker";
import { AttachmentScannedConsumer } from "@/features/attachment";
import { AttachmentIdentitySyncConsumer } from "@/features/identities";
import { AttachmentTenantSyncConsumer } from "@/features/tenants";

export { container, db } from "@/bootstrap";
export { builder, createContext } from "@/graphql";
export type { AttachmentContext } from "@/graphql";
export { schema } from "@/graphql/schema";

const main = async () => {
  await initializeDb();
  await bindHttpServer();
  await writeSchemaToDist();

  const httpServer = container.get<IHttpServer>(TYPES.HttpServer);
  await httpServer.start();
  logger.info("Attachment service listening on http://0.0.0.0:5003");
  httpServer.writeOpenApi(openApiOutputPath);

  await broker.init();

  void container.get<IWorker>(TYPES.OutboxWorker).start();
  void container.get<IWorker>(TYPES.OutboxCleanupWorker).start();
  void container.get<AttachmentIdentitySyncConsumer>(TYPES.AttachmentIdentitySyncConsumer).start();
  void container.get<AttachmentTenantSyncConsumer>(TYPES.AttachmentTenantSyncConsumer).start();
  void container.get<AttachmentScannedConsumer>(TYPES.AttachmentScannedConsumer).start();
  startImageWorker();
};

main().catch((error) => {
  console.log(error);
});
