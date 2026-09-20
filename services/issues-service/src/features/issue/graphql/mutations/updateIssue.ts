import { ItemPriority } from "@pine/common";
import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IIssueService } from "@/features/issue";
import { UpdateIssueInput } from "../inputs/UpdateIssueInput";

builder.mutationFields((t) => ({
  updateIssue: t.string({
    args: {
      input: t.arg({ type: UpdateIssueInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const userId = requireIdentityId(ctx);
      const service = container.get<IIssueService>(TYPES.IssueService);
      const { issueId } = input;

      await service.updateIssue({
        userId,
        issueId,
        name: input.name ?? undefined,
        type: input.type ?? undefined,
        statusId: input.statusId ?? undefined,
        priority: (input.priority as ItemPriority | null) ?? undefined,
        dueDate: input.dueDate === undefined ? undefined : input.dueDate,
        description: input.description ?? undefined,
        estimate: input.estimate ?? undefined,
        component: input.component ?? undefined,
      });

      return "Updated successfully";
    },
  }),
}));
