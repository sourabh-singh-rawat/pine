import { ApplicationError } from "@pine/errors";

export class OrganizationMemberConflictError extends ApplicationError {
  constructor(message = "Identity is already a member of this organization") {
    super("ORGANIZATION_MEMBER_CONFLICT", message, true);
  }
}
