import { ApplicationError } from "@pine/errors";

export class ItemAttachmentUploadRequestNotFoundError extends ApplicationError {
  constructor(message = "Item attachment upload request not found") {
    super("ITEM_ATTACHMENT_UPLOAD_REQUEST_NOT_FOUND", message, true);
  }
}
