import { ApplicationError } from "@pine/errors";

export class ItemReorderError extends ApplicationError {
  constructor(message = "Item order is invalid") {
    super("ITEM_REORDER_ERROR", message, true);
  }
}
