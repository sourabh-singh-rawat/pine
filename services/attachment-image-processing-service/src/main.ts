import { configureTls } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.ATTACHMENT_IMAGE_PROCESSING_SERVICE_TLS_CERT_PATH,
  keyPath: env.ATTACHMENT_IMAGE_PROCESSING_SERVICE_TLS_KEY_PATH,
});

import { broker, container, logger, TYPES } from "@/bootstrap";
import { AttachmentImageCreatedConsumer } from "@/features/image-processing";

export { container } from "@/bootstrap";

const main = async () => {
  await broker.init();

  void container.get<AttachmentImageCreatedConsumer>(TYPES.AttachmentImageCreatedConsumer).start();
  logger.info("Attachment image processing service started");
};

main().catch((error) => {
  console.log(error);
});
