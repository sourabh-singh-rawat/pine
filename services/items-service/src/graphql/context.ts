import type { GraphQLContext, HttpRequest } from "@pine/server";

export type ItemsContext = GraphQLContext;

export const createContext = async (request: HttpRequest): Promise<ItemsContext> => ({
  headers: request.headers,
  ...(request.identity ? { identity: request.identity } : {}),
  ...(request.tenantId ? { tenantId: request.tenantId } : {}),
  ...(request.workspaceId ? { workspaceId: request.workspaceId } : {}),
});
