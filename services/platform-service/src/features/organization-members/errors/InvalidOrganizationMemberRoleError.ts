import { ApplicationError } from "@pine/errors";

export class InvalidOrganizationMemberRoleError extends ApplicationError {
  constructor(message = "Invalid organization member role") {
    super("INVALID_ORGANIZATION_MEMBER_ROLE", message, true);
  }
}
