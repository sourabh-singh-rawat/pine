import { ApplicationError } from "@pine/errors";

export class InvalidParentOrganizationError extends ApplicationError {
  constructor(message = "Parent organization is invalid for this tenant") {
    super("INVALID_PARENT_ORGANIZATION", message, true);
  }
}
