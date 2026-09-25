import { ApplicationError } from "@pine/errors";

export class AttachmentUploadAlreadyProcessedError extends ApplicationError {
  constructor(status: string) {
    super("ATTACHMENT_UPLOAD_ALREADY_PROCESSED", `Upload is already ${status.toLowerCase()}`, true);
  }
}
