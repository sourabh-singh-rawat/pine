import { UnauthorizedError } from "@pine/common";

export const requireTenantId = (target: { tenantId?: string }): string => {
  if (!target.tenantId) {
    throw new UnauthorizedError("Missing tenant context");
  }

  return target.tenantId;
};

export const requireOrganizationId = (target: { organizationId?: string }): string => {
  if (!target.organizationId) {
    throw new UnauthorizedError("Missing organization context");
  }

  return target.organizationId;
};
