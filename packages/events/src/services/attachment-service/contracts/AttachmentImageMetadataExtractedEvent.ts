import { defineEvent } from "../../../cloud-events";
import { AttachmentImageMetadataExtractedDataSchema } from "../schemas";

export const AttachmentImageMetadataExtractedEvent = defineEvent({
  type: "attachment.image.metadata-extracted",
  version: 1,
  schema: AttachmentImageMetadataExtractedDataSchema,
});
