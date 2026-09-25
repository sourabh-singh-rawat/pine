import type { HttpRequest } from "@pine/server";
import { X_WORKSPACE_ID_HEADER, X_TENANT_ID_HEADER } from "./tenantContextHeaders";

const readHeaderValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
};

export const resolveTenantContextFromHeaders = (request: HttpRequest): void => {
  const tenantId = readHeaderValue(request.headers[X_TENANT_ID_HEADER]);
  const workspaceId = readHeaderValue(request.headers[X_WORKSPACE_ID_HEADER]);

  if (!tenantId || !workspaceId) {
    return;
  }

  request.tenantId = tenantId;
  request.workspaceId = workspaceId;
};
