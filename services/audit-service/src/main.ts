import { configureTls } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.AUDIT_SERVICE_TLS_CERT_PATH,
  keyPath: env.AUDIT_SERVICE_TLS_KEY_PATH,
});

import type { IHttpServer } from "@pine/server";
import { bindHttpServer, broker, container, initializeDb, TYPES } from "@/bootstrap";
import { writeSchemaToDist } from "@/bootstrap/graphql";
import { logger } from "@/bootstrap/logger";
import type { AuditAttachmentSyncConsumer } from "@/features/attachments";
import type { AuditIdentitySyncConsumer } from "@/features/identities";
import type { AuditItemsSyncConsumer } from "@/features/items";
import type { AuditPlatformSyncConsumer } from "@/features/workspaces";

export { container, db } from "@/bootstrap";
export { builder, createContext } from "@/graphql";
export type { AuditContext } from "@/graphql";
export { schema } from "@/graphql/schema";

const main = async () => {
  await initializeDb();
  await bindHttpServer();

  writeSchemaToDist();

  const httpServer = container.get<IHttpServer>(TYPES.HttpServer);
  await httpServer.start();
  logger.info("Audit service listening on https://0.0.0.0:5007");

  await broker.init();

  void container.get<AuditIdentitySyncConsumer>(TYPES.AuditIdentitySyncConsumer).start();
  void container.get<AuditItemsSyncConsumer>(TYPES.AuditItemsSyncConsumer).start();
  void container.get<AuditPlatformSyncConsumer>(TYPES.AuditPlatformSyncConsumer).start();
  void container.get<AuditAttachmentSyncConsumer>(TYPES.AuditAttachmentSyncConsumer).start();

  logger.info("Audit service started");
};

main().catch((error) => {
  console.log(error);
});
