import { ApplicationError } from "@pine/errors";

export class InvalidParentOrganizationTypeError extends ApplicationError {
  constructor(message = "Parent organization type is invalid for this tenant") {
    super("INVALID_PARENT_ORGANIZATION_TYPE", message, true);
  }
}
