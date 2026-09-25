import { builder } from "@pine/server";
import type { WorkspaceRelation } from "@/features/workspaces/services/IWorkspaceRelationService";

export const WorkspaceRelationObject =
  builder.objectRef<WorkspaceRelation>("WorkspaceRelationObject");

WorkspaceRelationObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    workspaceId: t.exposeString("workspaceId"),
    identityId: t.exposeString("identityId"),
    relation: t.exposeString("relation"),
  }),
});
