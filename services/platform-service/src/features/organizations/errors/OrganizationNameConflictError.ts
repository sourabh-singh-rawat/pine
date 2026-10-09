import { ApplicationError } from "@pine/errors";

export class OrganizationNameConflictError extends ApplicationError {
  constructor(message = "Organization name already exists in this tenant") {
    super("ORGANIZATION_NAME_CONFLICT", message, true);
  }
}
