import { ApplicationError } from "@pine/errors";

export class InvalidOrganizationRelationError extends ApplicationError {
  constructor(message = "Invalid organization relation") {
    super("INVALID_ORGANIZATION_RELATION", message, true);
  }
}
