export interface GraphQLContext {
  cookies?: Record<string, string | undefined>;
  headers: Record<string, string | undefined>;
  identity?: { id: string; authMethod: "access_token" | "session" };
  tenantId?: string;
  organizationId?: string;
}
