import { ApplicationError } from "@pine/errors";

export class ListItemsValidationError extends ApplicationError {
  constructor(message: string) {
    super("LIST_ITEMS_VALIDATION_ERROR", message, true);
  }
}
