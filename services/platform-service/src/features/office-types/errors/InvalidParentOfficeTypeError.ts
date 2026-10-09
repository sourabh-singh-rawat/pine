import { ApplicationError } from "@pine/errors";

export class InvalidParentOfficeTypeError extends ApplicationError {
  constructor(message = "Parent office type is invalid for this tenant") {
    super("INVALID_PARENT_OFFICE_TYPE", message, true);
  }
}
