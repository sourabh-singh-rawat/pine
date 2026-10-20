import { ApplicationError } from "@pine/errors";

export class InvalidTenantMemberRoleError extends ApplicationError {
  constructor(message = "Invalid tenant member role") {
    super("INVALID_TENANT_MEMBER_ROLE", message, true);
  }
}
