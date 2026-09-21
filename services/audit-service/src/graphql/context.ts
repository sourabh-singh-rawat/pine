import type { GraphQLContext, HttpRequest } from "@pine/server";

export type AuditContext = GraphQLContext;

export const createContext = async (request: HttpRequest): Promise<AuditContext> => ({
  headers: request.headers,
  ...(request.identity ? { identity: request.identity } : {}),
  ...(request.tenantId ? { tenantId: request.tenantId } : {}),
  ...(request.workspaceId ? { workspaceId: request.workspaceId } : {}),
});
