import { ApplicationError } from "@pine/errors";

export class OrganizationRelationNotFoundError extends ApplicationError {
  constructor(message = "Organization relation not found") {
    super("ORGANIZATION_RELATION_NOT_FOUND", message, true);
  }
}
