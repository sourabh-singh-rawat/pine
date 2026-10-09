import { ApplicationError } from "@pine/errors";

export class OrganizationNotFoundError extends ApplicationError {
  constructor(message = "Organization not found") {
    super("ORGANIZATION_NOT_FOUND", message, true);
  }
}
