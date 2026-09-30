import { defineEvent } from "../../../cloud-events";
import { AttachmentDerivativeCreatedDataSchema } from "../schemas";

export const AttachmentDerivativeCreatedEvent = defineEvent({
  type: "attachment.derivative.created",
  version: 1,
  schema: AttachmentDerivativeCreatedDataSchema,
});
