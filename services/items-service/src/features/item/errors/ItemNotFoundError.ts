import { ApplicationError } from "@pine/errors";

export class ItemNotFoundError extends ApplicationError {
  constructor(message = "Item not found") {
    super("ITEM_NOT_FOUND", message, true);
  }
}
