import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { WorkspacePreferenceObject } from "@/features/workspaces/graphql/objects/WorkspacePreferenceObject";
import type { IWorkspacePreferenceService } from "@/features/workspaces/services";

builder.mutationFields((t) => ({
  setMyWorkspacePreference: t.field({
    type: WorkspacePreferenceObject,
    args: {
      workspaceId: t.arg.string({ required: true }),
    },
    authScopes: {
      identityRequired: true,
    },
    resolve: async (_root, { workspaceId }, ctx) => {
      const service = container.get<IWorkspacePreferenceService>(TYPES.WorkspacePreferenceService);
      return service.set(workspaceId, requireIdentityId(ctx));
    },
  }),
}));
