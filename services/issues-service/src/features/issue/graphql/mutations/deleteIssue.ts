import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IIssueService } from "@/features/issue";

builder.mutationFields((t) => ({
  deleteIssue: t.string({
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const userId = requireIdentityId(ctx);
      const service = container.get<IIssueService>(TYPES.IssueService);
      await service.deleteIssue({ id, userId });
      return "Deleted successfully";
    },
  }),
}));
