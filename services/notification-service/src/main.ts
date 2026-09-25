import { configureTls } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.NOTIFICATION_SERVICE_TLS_CERT_PATH,
  keyPath: env.NOTIFICATION_SERVICE_TLS_KEY_PATH,
});

import { broker, container, initializeDb, logger, TYPES } from "@/bootstrap";
import { NotificationIdentitySyncConsumer } from "@/features/identities";

export { container, db } from "@/bootstrap";

const main = async () => {
  await initializeDb();
  await broker.init();

  void container
    .get<NotificationIdentitySyncConsumer>(TYPES.NotificationIdentitySyncConsumer)
    .start();
  logger.info("Notification service started");
};

main().catch((error) => {
  console.log(error);
});
