import { ApplicationError } from "@pine/errors";

export class OrganizationTypeConflictError extends ApplicationError {
  constructor(message = "Organization type already exists") {
    super("ORGANIZATION_TYPE_CONFLICT", message, true);
  }
}
