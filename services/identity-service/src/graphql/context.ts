import type { GraphQLContext, HttpRequest } from "@pine/server";

export type AuthContext = GraphQLContext;

export const createContext = async (request: HttpRequest): Promise<AuthContext> => ({
  headers: request.headers,
  ...(request.identity ? { identity: request.identity } : {}),
  ...(request.tenantId ? { tenantId: request.tenantId } : {}),
  ...(request.organizationId ? { organizationId: request.organizationId } : {}),
});
