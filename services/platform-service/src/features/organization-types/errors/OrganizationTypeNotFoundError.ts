import { ApplicationError } from "@pine/errors";

export class OrganizationTypeNotFoundError extends ApplicationError {
  constructor(message = "Organization type not found") {
    super("ORGANIZATION_TYPE_NOT_FOUND", message, true);
  }
}
