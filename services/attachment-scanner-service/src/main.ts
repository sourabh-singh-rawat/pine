import { configureTls } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.ATTACHMENT_SCANNER_SERVICE_TLS_CERT_PATH,
  keyPath: env.ATTACHMENT_SCANNER_SERVICE_TLS_KEY_PATH,
});

import { broker, container, logger, TYPES } from "@/bootstrap";
import { AttachmentQuarantinedConsumer } from "@/features/attachment-scanner";

export { container } from "@/bootstrap";

const main = async () => {
  await broker.init();

  void container.get<AttachmentQuarantinedConsumer>(TYPES.AttachmentQuarantinedConsumer).start();
  logger.info("Attachment scanner service started");
};

main().catch((error) => {
  console.log(error);
});
