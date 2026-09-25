export type { IIdentityClient } from "./IIdentityClient";
export { HttpIdentityClient, type HttpIdentityClientOptions } from "./HttpIdentityClient";
export { resolveIdentityFromHeaders } from "./resolveIdentityFromHeaders";
export { resolveTenantContextFromHeaders } from "./resolveTenantContextFromHeaders";
export { requireIdentity, requireIdentityId } from "./requireIdentity";
export { requireWorkspaceId, requireTenantId } from "./requireTenantContext";
export { X_WORKSPACE_ID_HEADER, X_TENANT_ID_HEADER } from "./tenantContextHeaders";
export {
  GetIdentityFromAccessTokenResponseSchema,
  GetIdentityFromSessionResponseSchema,
  IdentitySchema,
} from "./schemas";
export type {
  GetIdentityFromAccessTokenResponse,
  GetIdentityFromSessionResponse,
  Identity,
} from "./schemas";
