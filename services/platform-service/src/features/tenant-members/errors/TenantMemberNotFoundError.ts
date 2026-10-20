import { ApplicationError } from "@pine/errors";

export class TenantMemberNotFoundError extends ApplicationError {
  constructor(message = "Tenant member not found") {
    super("TENANT_MEMBER_NOT_FOUND", message, true);
  }
}
