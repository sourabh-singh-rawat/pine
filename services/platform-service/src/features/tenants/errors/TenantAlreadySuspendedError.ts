import { ApplicationError } from "@pine/errors";

export class TenantAlreadySuspendedError extends ApplicationError {
  constructor(message = "Tenant is already suspended") {
    super("TENANT_ALREADY_SUSPENDED", message, true);
  }
}
