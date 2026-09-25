import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { container } from "@/bootstrap/container";
import { TYPES } from "@/bootstrap/container-types";
import { WorkspacePreferenceObject } from "@/features/workspaces/graphql/objects/WorkspacePreferenceObject";
import type { IWorkspacePreferenceService } from "@/features/workspaces/services";

builder.queryFields((t) => ({
  getMyWorkspacePreference: t.field({
    type: WorkspacePreferenceObject,
    nullable: true,
    authScopes: {
      identityRequired: true,
    },
    resolve: async (_root, _args, ctx) => {
      const service = container.get<IWorkspacePreferenceService>(TYPES.WorkspacePreferenceService);
      return service.get(requireIdentityId(ctx));
    },
  }),
}));
