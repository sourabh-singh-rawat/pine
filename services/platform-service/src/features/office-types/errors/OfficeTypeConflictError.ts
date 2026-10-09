import { ApplicationError } from "@pine/errors";

export class OfficeTypeConflictError extends ApplicationError {
  constructor(message = "Office type already exists") {
    super("OFFICE_TYPE_CONFLICT", message, true);
  }
}
