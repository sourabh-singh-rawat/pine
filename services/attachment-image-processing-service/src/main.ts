import { configureTls } from "@pine/common/tls";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.ATTACHMENT_IMAGE_PROCESSING_SERVICE_TLS_CERT_PATH,
  keyPath: env.ATTACHMENT_IMAGE_PROCESSING_SERVICE_TLS_KEY_PATH,
});

import { broker, container, logger, TYPES } from "@/bootstrap";
import type { AttachmentImageMetadataConsumer } from "@/features/metadata-processing";
import type { AttachmentImageThumbnailConsumer } from "@/features/thumbnail-processing";

export { container } from "@/bootstrap";

const main = async () => {
  await broker.init();

  void container
    .get<AttachmentImageThumbnailConsumer>(TYPES.AttachmentImageThumbnailConsumer)
    .start();
  void container
    .get<AttachmentImageMetadataConsumer>(TYPES.AttachmentImageMetadataConsumer)
    .start();
  logger.info("Attachment image processing service started");
};

main().catch((error) => {
  console.log(error);
});
