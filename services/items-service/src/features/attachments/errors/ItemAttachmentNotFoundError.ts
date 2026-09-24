import { ApplicationError } from "@pine/errors";

export class ItemAttachmentNotFoundError extends ApplicationError {
  constructor(message = "Item attachment not found") {
    super("ITEM_ATTACHMENT_NOT_FOUND", message, true);
  }
}
