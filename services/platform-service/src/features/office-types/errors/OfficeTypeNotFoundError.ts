import { ApplicationError } from "@pine/errors";

export class OfficeTypeNotFoundError extends ApplicationError {
  constructor(message = "Office type not found") {
    super("OFFICE_TYPE_NOT_FOUND", message, true);
  }
}
