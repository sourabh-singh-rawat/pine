import type { HttpRequest } from "@pine/server";
import type { GraphQLContext } from "@pine/server";

export type AuthContext = GraphQLContext;

export const createContext = async (request: HttpRequest): Promise<AuthContext> => ({
  headers: request.headers,
  ...(request.identity ? { identity: request.identity } : {}),
  ...(request.tenantId ? { tenantId: request.tenantId } : {}),
  ...(request.organizationId ? { organizationId: request.organizationId } : {}),
});
