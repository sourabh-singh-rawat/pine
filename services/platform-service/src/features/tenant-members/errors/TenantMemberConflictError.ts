import { ApplicationError } from "@pine/errors";

export class TenantMemberConflictError extends ApplicationError {
  constructor(message = "Identity is already a member of this tenant") {
    super("TENANT_MEMBER_CONFLICT", message, true);
  }
}
