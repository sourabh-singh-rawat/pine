import { ApplicationError } from "@pine/errors";

export class OrganizationMemberNotFoundError extends ApplicationError {
  constructor(message = "Organization member not found") {
    super("ORGANIZATION_MEMBER_NOT_FOUND", message, true);
  }
}
