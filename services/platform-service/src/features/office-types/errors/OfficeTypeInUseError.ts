import { ApplicationError } from "@pine/errors";

export class OfficeTypeInUseError extends ApplicationError {
  constructor(message = "Office type is used as a parent") {
    super("OFFICE_TYPE_IN_USE", message, true);
  }
}
