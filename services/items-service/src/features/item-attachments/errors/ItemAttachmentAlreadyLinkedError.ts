import { ApplicationError } from "@pine/errors";

export class ItemAttachmentAlreadyLinkedError extends ApplicationError {
  constructor(message = "Attachment is already linked to this item") {
    super("ITEM_ATTACHMENT_ALREADY_LINKED", message, true);
  }
}
