import type { HttpRequest } from "@pine/server";
import { X_ORGANIZATION_ID_HEADER, X_TENANT_ID_HEADER } from "./tenantContextHeaders";

const readHeaderValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
};

export const resolveTenantContextFromHeaders = (request: HttpRequest): void => {
  const tenantId = readHeaderValue(request.headers[X_TENANT_ID_HEADER]);
  const organizationId = readHeaderValue(request.headers[X_ORGANIZATION_ID_HEADER]);

  if (!tenantId || !organizationId) {
    return;
  }

  request.tenantId = tenantId;
  request.organizationId = organizationId;
};
