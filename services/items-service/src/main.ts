import { configureTls } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.ITEMS_SERVICE_TLS_CERT_PATH,
  keyPath: env.ITEMS_SERVICE_TLS_KEY_PATH,
});

import type { IHttpServer } from "@pine/server";
import type { IOutboxCleanupWorker, IOutboxWorker } from "@pine/outbox";
import { bindHttpServer, broker, container, initializeDb, TYPES } from "@/bootstrap";
import { writeSchemaToDist } from "@/bootstrap/graphql";
import { logger } from "@/bootstrap/logger";
import { ItemsIdentitySyncConsumer } from "@/features/identities";
import { ItemAttachmentCreatedConsumer } from "@/features/attachments";

export { container, db } from "@/bootstrap";
export { builder, createContext } from "@/graphql";
export type { ItemsContext } from "@/graphql";
export { schema } from "@/graphql/schema";

const main = async () => {
  await initializeDb();
  await bindHttpServer();

  writeSchemaToDist();

  const httpServer = container.get<IHttpServer>(TYPES.HttpServer);
  await httpServer.start();
  logger.info("Items service listening on http://0.0.0.0:5001");

  await broker.init();

  void container.get<IOutboxWorker>(TYPES.OutboxWorker).start();
  void container.get<IOutboxCleanupWorker>(TYPES.OutboxCleanupWorker).start();
  void container.get<ItemsIdentitySyncConsumer>(TYPES.ItemsIdentitySyncConsumer).start();
  void container
    .get<ItemAttachmentCreatedConsumer>(TYPES.ItemAttachmentCreatedConsumer)
    .start();
};

main().catch((error) => {
  console.log(error);
});
